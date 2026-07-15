import "server-only";
import { createClient } from "@/lib/supabase/server";

const pageSize = 20;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type AnalysisRow = {
  id: string; instagram_username: string; instagram_profile_url: string; status: string; created_at: string;
  updated_at: string; utm_source: string | null; utm_campaign: string | null; user_id: string | null;
  anonymous_session_id: string; expires_at: string; utm_medium?: string | null; utm_content?: string | null;
  utm_term?: string | null; referrer?: string | null; landing_page?: string | null; metadata?: Record<string, unknown>;
  admin_notes?: string | null; anonymized_at?: string | null;
};

export type ContactRow = {
  id: string; name: string; email: string; subject: string; message: string; status: string;
  created_at: string; updated_at: string; admin_notes: string | null; anonymized_at: string | null;
};

function safePage(value?: string) {
  const page = Number(value || "1");
  return Number.isInteger(page) && page > 0 ? Math.min(page, 10000) : 1;
}

function safeDate(value: string | undefined, endOfDay = false) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function getDashboardData() {
  const supabase = await createClient();
  const [metrics, requests, contacts, audits] = await Promise.all([
    supabase.rpc("admin_dashboard_metrics"),
    supabase.from("analysis_requests").select("id,instagram_username,status,created_at,utm_source,utm_campaign").order("created_at", { ascending: false }).limit(6),
    supabase.from("contact_messages").select("id,name,subject,status,created_at").order("created_at", { ascending: false }).limit(6),
    supabase.from("admin_audit_logs").select("id,action,entity_type,created_at,admin_role").order("created_at", { ascending: false }).limit(6),
  ]);
  const aggregated = metrics.data as { counts?: Record<string, number>; by_status?: Record<string, number>; sources?: Record<string, number>; campaigns?: Record<string, number> } | null;
  return {
    counts: {
      today: aggregated?.counts?.today ?? 0, week: aggregated?.counts?.week ?? 0,
      pending: aggregated?.counts?.pending ?? 0, failed: aggregated?.counts?.failed ?? 0,
      contacts: aggregated?.counts?.contacts ?? 0,
    },
    requests: requests.data || [], contacts: contacts.data || [], audits: audits.data || [],
    byStatus: aggregated?.by_status || {},
    sources: topFive(aggregated?.sources || {}),
    campaigns: topFive(aggregated?.campaigns || {}),
    operational: !metrics.error && Boolean(aggregated?.counts),
  };
}
function topFive(values: Record<string, number>) {
  return Object.entries(values).sort((a, b) => b[1] - a[1]).slice(0, 5);
}

export async function listAnalysisRequests(params: Record<string, string | undefined>) {
  const supabase = await createClient();
  const page = safePage(params.page); const from = (page - 1) * pageSize;
  let query = supabase.from("analysis_requests")
    .select("id,instagram_username,status,created_at,utm_source,utm_campaign,user_id,expires_at", { count: "exact" });
  if (params.search) query = query.ilike("instagram_username", `%${params.search.slice(0, 30).replace(/[%_]/g, "")}%`);
  if (params.status) query = query.eq("status", params.status.slice(0, 40));
  if (params.source) query = query.eq("utm_source", params.source.slice(0, 200));
  if (params.campaign) query = query.eq("utm_campaign", params.campaign.slice(0, 200));
  const fromDate = safeDate(params.from);
  const toDate = safeDate(params.to, true);
  if (fromDate) query = query.gte("created_at", fromDate);
  if (toDate) query = query.lte("created_at", toDate);
  const ascending = params.order === "oldest";
  const { data, error, count } = await query.order("created_at", { ascending }).range(from, from + pageSize - 1);
  if (error) throw new Error("Não foi possível consultar as solicitações.");
  return { rows: data as AnalysisRow[], page, totalPages: Math.max(1, Math.ceil((count || 0) / pageSize)), total: count || 0 };
}

export async function getAnalysisRequest(id: string) {
  if (!uuidPattern.test(id)) return null;
  const supabase = await createClient();
  const [record, history] = await Promise.all([
    supabase.from("analysis_requests").select("id,instagram_username,instagram_profile_url,status,created_at,updated_at,utm_source,utm_medium,utm_campaign,utm_content,utm_term,referrer,landing_page,anonymous_session_id,user_id,metadata,expires_at,admin_notes,anonymized_at").eq("id", id).maybeSingle(),
    supabase.from("admin_audit_logs").select("id,created_at,admin_role,action,before_data,after_data,metadata").eq("entity_type", "analysis_request").eq("entity_id", id).order("created_at", { ascending: false }).limit(50),
  ]);
  if (record.error) throw new Error("Não foi possível consultar a solicitação.");
  return record.data ? { record: record.data as AnalysisRow, history: history.data || [] } : null;
}

export async function listContacts(params: Record<string, string | undefined>) {
  const supabase = await createClient();
  const page = safePage(params.page); const from = (page - 1) * pageSize;
  let query = supabase.from("contact_messages")
    .select("id,name,email,subject,status,created_at,updated_at,admin_notes,anonymized_at,message", { count: "exact" });
  if (params.search) {
    const clean = params.search.slice(0, 100).replace(/[%_,()]/g, "");
    query = query.or(`name.ilike.%${clean}%,email.ilike.%${clean}%`);
  }
  if (params.status) query = query.eq("status", params.status.slice(0, 40));
  if (params.subject) query = query.eq("subject", params.subject.slice(0, 40));
  const { data, error, count } = await query.order("created_at", { ascending: params.order === "oldest" }).range(from, from + pageSize - 1);
  if (error) throw new Error("Não foi possível consultar os contatos.");
  return { rows: data as ContactRow[], page, totalPages: Math.max(1, Math.ceil((count || 0) / pageSize)), total: count || 0 };
}

export async function getContact(id: string) {
  if (!uuidPattern.test(id)) return null;
  const supabase = await createClient();
  const [record, history] = await Promise.all([
    supabase.from("contact_messages").select("id,name,email,subject,message,status,created_at,updated_at,admin_notes,anonymized_at").eq("id", id).maybeSingle(),
    supabase.from("admin_audit_logs").select("id,created_at,admin_role,action,before_data,after_data").eq("entity_type", "contact_message").eq("entity_id", id).order("created_at", { ascending: false }).limit(50),
  ]);
  if (record.error) throw new Error("Não foi possível consultar o contato.");
  return record.data ? { record: record.data as ContactRow, history: history.data || [] } : null;
}

export async function listAdminTable(table: "app_settings" | "feature_flags" | "site_content" | "site_faqs" | "admin_profiles" | "admin_audit_logs") {
  const supabase = await createClient();
  const orderColumn = table === "admin_profiles" ? "created_at" : table === "site_content" ? "content_key" : "key";
  const query = table === "admin_audit_logs"
    ? supabase.from(table).select("id,created_at,admin_role,action,entity_type,entity_id,metadata").order("created_at", { ascending: false }).limit(100)
    : table === "site_faqs"
      ? supabase.from(table).select("*").order("position", { ascending: true }).limit(200)
      : supabase.from(table).select("*").order(orderColumn, { ascending: table !== "admin_profiles" }).limit(200);
  const { data, error } = await query;
  if (error) throw new Error("Não foi possível consultar os dados administrativos.");
  return data || [];
}

export async function getProductResourcesAdminData() {
  const supabase = await createClient();
  const [features, categories, interest, dashboardModules, dashboardFlags] = await Promise.all([
    supabase.from("product_features").select("key,name,description,feature_group,audience,status,visibility,enabled,requires_provider_call,provider,dependencies,estimated_credit_cost,limits,metadata,updated_at,updated_by").order("feature_group").order("name"),
    supabase.from("content_categories").select("id,slug,name,description,keywords,seed_hashtags,excluded_terms,language,country,enabled,visible,refresh_minutes,position,updated_at").order("position").order("name"),
    supabase.from("feature_interest").select("feature_key"),
    supabase.from("dashboard_modules").select("key,title,description,icon,chart_type,enabled,visible,access_level,status,display_order,requires_ai,requires_authentication,requires_premium,configuration,updated_at,updated_by").order("display_order"),
    supabase.from("feature_flags").select("id,key,name,enabled").or("key.like.dashboard_%,key.eq.resource_reels_by_category").order("key"),
  ]);
  if (features.error || categories.error || interest.error || dashboardModules.error || dashboardFlags.error) throw new Error("Não foi possível consultar o catálogo de recursos. A migration local pode ainda não ter sido aplicada.");
  const interestCounts = (interest.data || []).reduce<Record<string, number>>((counts, row) => { counts[row.feature_key] = (counts[row.feature_key] ?? 0) + 1; return counts; }, {});
  return { features: features.data || [], categories: categories.data || [], interestCounts, dashboardModules: dashboardModules.data || [], dashboardFlags: dashboardFlags.data || [] };
}
