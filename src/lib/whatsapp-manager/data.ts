import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getEncurtaLinkSnapshot } from "@/lib/integrations/encurta";
import type { LinkMetricCache, ManagerLink } from "./types";

const linkFields = "id,user_id,encurta_link_id,title,phone,message,slug,short_url,official_url,status,labels,expires_at,archived_at,deleted_at,last_clicked_at,click_count,created_at,updated_at";
const metricCacheMs = 5 * 60 * 1000;

type MetricRow = { link_id: string; total_clicks: number; daily: unknown; cached_at: string };
type SyncLink = { id: string; encurta_link_id: string; click_count: number };

function safeDaily(value: unknown) {
  if (!Array.isArray(value)) return [] as Array<{ date: string; clicks: number }>;
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const row = item as { date?: unknown; clicks?: unknown };
    return typeof row.date === "string" && Number.isFinite(Number(row.clicks)) ? [{ date: row.date, clicks: Math.max(0, Number(row.clicks)) }] : [];
  }).slice(-90);
}

function addObservedClicks(daily: Array<{ date: string; clicks: number }>, delta: number, today: string) {
  if (delta <= 0) return daily;
  const next = [...daily];
  const current = next.find((item) => item.date === today);
  if (current) current.clicks += delta;
  else next.push({ date: today, clicks: delta });
  return next.slice(-90);
}

export async function syncCurrentUserLinkMetrics(linkId?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const admin = createAdminClient();
  if (!user || !admin) return { synced: 0, failed: 0 };
  let linkQuery = admin.from("user_whatsapp_links").select("id,encurta_link_id,click_count").eq("user_id", user.id).is("deleted_at", null).limit(10);
  if (linkId) linkQuery = linkQuery.eq("id", linkId);
  const { data: rawLinks } = await linkQuery;
  const links = (rawLinks || []) as SyncLink[];
  if (!links.length) return { synced: 0, failed: 0 };
  const { data: rawCache } = await admin.from("user_link_metric_cache").select("link_id,total_clicks,daily,cached_at").in("link_id", links.map((link) => link.id));
  const cache = new Map(((rawCache || []) as MetricRow[]).map((row) => [row.link_id, row]));
  const stale = links.filter((link) => {
    const cached = cache.get(link.id);
    return !cached || Date.now() - new Date(cached.cached_at).getTime() >= metricCacheMs;
  });
  let synced = 0;
  let failed = 0;
  const today = new Date().toISOString().slice(0, 10);
  await Promise.all(stale.map(async (link) => {
    try {
      const snapshot = await getEncurtaLinkSnapshot(link.encurta_link_id);
      const previous = cache.get(link.id);
      const previousTotal = Math.max(Number(previous?.total_clicks ?? link.click_count ?? 0), 0);
      const total = Math.max(snapshot.clickCount, previousTotal);
      const daily = addObservedClicks(safeDaily(previous?.daily), total - previousTotal, today);
      const status = snapshot.status === "active" ? "active" : snapshot.status === "expired" ? "expired" : "inactive";
      const now = new Date().toISOString();
      const [linkUpdate, cacheUpdate] = await Promise.all([
        admin.from("user_whatsapp_links").update({ click_count: total, last_clicked_at: snapshot.lastAccessedAt, status }).eq("id", link.id).eq("user_id", user.id),
        admin.from("user_link_metric_cache").upsert({ link_id: link.id, user_id: user.id, total_clicks: total, last_click_at: snapshot.lastAccessedAt, daily, devices: [], referrers: [], human_estimate: null, bot_count: null, source_updated_at: now, cached_at: now }, { onConflict: "link_id" }),
      ]);
      if (linkUpdate.error || cacheUpdate.error) throw new Error("metric_persistence_failed");
      synced += 1;
    } catch {
      failed += 1;
    }
  }));
  return { synced, failed };
}

export async function listUserLinks(options: { query?: string; status?: string; archived?: boolean; limit?: number; syncMetrics?: boolean } = {}) {
  if (options.syncMetrics !== false) await syncCurrentUserLinkMetrics();
  const supabase = await createClient();
  let request = supabase.from("user_whatsapp_links").select(linkFields).is("deleted_at", null).order("created_at", { ascending: false }).limit(options.limit ?? 100);
  request = options.archived ? request.not("archived_at", "is", null) : request.is("archived_at", null);
  if (options.status && ["active", "inactive", "expired"].includes(options.status)) request = request.eq("status", options.status);
  if (options.query) {
    const safe = options.query.replace(/[%_,()]/g, "").slice(0, 80);
    if (safe) request = request.or(`title.ilike.%${safe}%,slug.ilike.%${safe}%`);
  }
  const { data, error } = await request;
  if (error) return [];
  return (data ?? []) as unknown as ManagerLink[];
}

export async function getUserLink(id: string, options: { syncMetrics?: boolean } = {}) {
  if (options.syncMetrics !== false) await syncCurrentUserLinkMetrics(id);
  const supabase = await createClient();
  const { data, error } = await supabase.from("user_whatsapp_links").select(linkFields).eq("id", id).is("deleted_at", null).maybeSingle();
  return error ? null : data as unknown as ManagerLink | null;
}

export async function getLinkMetrics(id: string, options: { syncMetrics?: boolean } = {}) {
  if (options.syncMetrics !== false) await syncCurrentUserLinkMetrics(id);
  const supabase = await createClient();
  const { data, error } = await supabase.from("user_link_metric_cache").select("link_id,total_clicks,last_click_at,daily,devices,referrers,human_estimate,bot_count,cached_at").eq("link_id", id).maybeSingle();
  return error ? null : data as unknown as LinkMetricCache | null;
}

function dateSeries(days: number) {
  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    date.setUTCDate(date.getUTCDate() - (days - index - 1));
    return date.toISOString().slice(0, 10);
  });
}

export async function getDashboardData() {
  await syncCurrentUserLinkMetrics();
  const links = await listUserLinks({ limit: 100, syncMetrics: false });
  const supabase = await createClient();
  const { data: metrics } = links.length ? await supabase.from("user_link_metric_cache").select("daily").in("link_id", links.map((link) => link.id)) : { data: [] };
  const days = dateSeries(14);
  const clickMap = new Map(days.map((date) => [date, 0]));
  for (const row of metrics || []) for (const item of safeDaily(row.daily)) if (clickMap.has(item.date)) clickMap.set(item.date, (clickMap.get(item.date) || 0) + item.clicks);
  const creationMap = new Map(days.map((date) => [date, 0]));
  for (const link of links) {
    const date = link.created_at.slice(0, 10);
    if (creationMap.has(date)) creationMap.set(date, (creationMap.get(date) || 0) + 1);
  }
  const clickTrend = days.map((date) => ({ date, value: clickMap.get(date) || 0 }));
  const creationTrend = days.map((date) => ({ date, value: creationMap.get(date) || 0 }));
  const last7Days = clickTrend.slice(-7).reduce((sum, item) => sum + item.value, 0);
  return {
    links,
    recent: links.slice(0, 5),
    total: links.length,
    active: links.filter((link) => link.status === "active").length,
    inactive: links.filter((link) => link.status === "inactive").length,
    expired: links.filter((link) => link.status === "expired").length,
    totalClicks: links.reduce((sum, link) => sum + Number(link.click_count || 0), 0),
    last7Days,
    clickTrend,
    creationTrend,
    topLinks: [...links].sort((a, b) => Number(b.click_count) - Number(a.click_count)).slice(0, 5),
  };
}
