import "server-only";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProductFeatureAudience, ProductFeatureStatus, ProductFeatureVisibility } from "./catalog";

export type HashtagTrend = "alta" | "estável" | "baixa";
export type HashtagPopularity = "alta" | "média" | "baixa";
export type PublicHashtagItem = {
  id: string;
  hashtag: string;
  occurrences: number;
  trend: HashtagTrend;
  category: string;
  categorySlug: string;
  contentsFound: number;
  updatedAt: string;
  popularity: HashtagPopularity;
  related: string[];
};
export type RecurringHashtagItem = { hashtag: string; occurrences: number; contentsFound: number; categories: string[]; trend: HashtagTrend };

export type HashtagResourceConfig = {
  enabled: boolean;
  flagEnabled: boolean;
  audience: ProductFeatureAudience;
  status: ProductFeatureStatus;
  visibility: ProductFeatureVisibility;
  maxItems: number;
  cacheMinutes: number;
  automaticRefresh: boolean;
  indexable: boolean;
};

export type HashtagResourceAccess = { available: boolean; locked: boolean; reason: "allowed" | "disabled" | "authentication_required" | "premium_required" | "admin_required" };
export type HashtagFilters = { query?: string; category?: string; period?: "7" | "30" | "90"; trend?: HashtagTrend | ""; popularity?: HashtagPopularity | "" };

type CategoryRow = { id: string; slug: string; name: string };
type SnapshotRow = { category_id: string; snapshot: unknown; fetched_at: string; expires_at: string };

const record = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const textValue = (source: Record<string, unknown>, keys: string[]) => keys.map((key) => source[key]).find((value): value is string => typeof value === "string" && value.trim().length > 0)?.trim() ?? "";
const numberValue = (source: Record<string, unknown>, keys: string[]) => {
  const value = keys.map((key) => source[key]).find((candidate) => typeof candidate === "number" || (typeof candidate === "string" && candidate.trim() !== ""));
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : 0;
};
const signedNumberValue = (source: Record<string, unknown>, keys: string[]) => {
  const value = keys.map((key) => source[key]).find((candidate) => typeof candidate === "number" || (typeof candidate === "string" && candidate.trim() !== ""));
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const hashtagName = (value: string) => value.trim().toLocaleLowerCase("pt-BR").replace(/^#+/, "").replace(/[^\p{L}\p{N}_]/gu, "").slice(0, 80);

function trendFor(source: Record<string, unknown>): HashtagTrend {
  const label = textValue(source, ["trend", "trendDirection", "trend_direction", "tendency", "tendencia"]).toLocaleLowerCase("pt-BR");
  if (["alta", "up", "rising", "growing", "crescendo", "growth"].some((term) => label.includes(term))) return "alta";
  if (["baixa", "down", "falling", "declining", "queda"].some((term) => label.includes(term))) return "baixa";
  const change = signedNumberValue(source, ["growthRate", "growth_rate", "changePercent", "change_percent"]);
  if (change < -5) return "baixa";
  return change > 5 ? "alta" : "estável";
}

function popularityFor(source: Record<string, unknown>, occurrences: number): HashtagPopularity {
  const label = textValue(source, ["popularity", "popularityLevel", "popularity_level", "popularidade"]).toLocaleLowerCase("pt-BR");
  if (["alta", "high", "viral"].some((term) => label.includes(term))) return "alta";
  if (["média", "media", "medium", "moderate"].some((term) => label.includes(term))) return "média";
  if (["baixa", "low", "niche", "nicho"].some((term) => label.includes(term))) return "baixa";
  return occurrences >= 1000 ? "alta" : occurrences >= 100 ? "média" : "baixa";
}

function itemsFromSnapshot(snapshot: unknown): unknown[] {
  const source = record(snapshot);
  for (const key of ["items", "hashtags", "results", "data"]) if (Array.isArray(source[key])) return source[key] as unknown[];
  return [];
}

export function normalizeHashtagSnapshot(snapshot: unknown, category: CategoryRow, fetchedAt: string): PublicHashtagItem[] {
  return itemsFromSnapshot(snapshot).flatMap((value) => {
    const source = record(value);
    const hashtag = hashtagName(textValue(source, ["hashtag", "tag", "name", "label"]));
    if (!hashtag) return [];
    const occurrences = numberValue(source, ["occurrences", "occurrenceCount", "occurrence_count", "count", "frequency", "uses"]);
    const contentsFound = numberValue(source, ["contentsFound", "contents_found", "contentCount", "content_count", "postsCount", "posts_count", "posts"]) || occurrences;
    const relatedSource = source.related ?? source.relatedHashtags ?? source.related_hashtags;
    const related = Array.isArray(relatedSource) ? [...new Set(relatedSource.flatMap((item) => typeof item === "string" ? [hashtagName(item)] : []).filter(Boolean))].slice(0, 5) : [];
    const updatedAt = textValue(source, ["updatedAt", "updated_at", "fetchedAt", "fetched_at"]) || fetchedAt;
    return [{ id: `${category.slug}:${hashtag}`, hashtag, occurrences, trend: trendFor(source), category: category.name, categorySlug: category.slug, contentsFound, updatedAt, popularity: popularityFor(source, occurrences), related }];
  });
}

export function filterPublicHashtags(items: PublicHashtagItem[], filters: HashtagFilters, maxItems: number, now = new Date()) {
  const query = hashtagName(filters.query ?? "");
  const periodDays = Number(filters.period ?? "30");
  const cutoff = now.getTime() - (Number.isFinite(periodDays) ? periodDays : 30) * 86_400_000;
  return items.filter((item) => (!query || item.hashtag.includes(query) || item.related.some((related) => related.includes(query))) && (!filters.category || item.categorySlug === filters.category) && (!filters.trend || item.trend === filters.trend) && (!filters.popularity || item.popularity === filters.popularity) && new Date(item.updatedAt).getTime() >= cutoff).sort((a, b) => b.occurrences - a.occurrences || b.contentsFound - a.contentsFound || a.hashtag.localeCompare(b.hashtag, "pt-BR")).slice(0, Math.max(1, Math.min(100, maxItems)));
}

export function getMostRecurringHashtags(items: PublicHashtagItem[], limit = 8): RecurringHashtagItem[] {
  const grouped = new Map<string, RecurringHashtagItem>();
  for (const item of items) {
    const current = grouped.get(item.hashtag) ?? { hashtag: item.hashtag, occurrences: 0, contentsFound: 0, categories: [], trend: item.trend };
    current.occurrences += item.occurrences;
    current.contentsFound += item.contentsFound;
    if (!current.categories.includes(item.category)) current.categories.push(item.category);
    if (item.trend === "alta") current.trend = "alta";
    else if (item.trend === "baixa" && current.trend !== "alta") current.trend = "baixa";
    grouped.set(item.hashtag, current);
  }
  return [...grouped.values()].sort((a, b) => b.occurrences - a.occurrences || b.contentsFound - a.contentsFound || a.hashtag.localeCompare(b.hashtag, "pt-BR")).slice(0, Math.max(1, Math.min(20, limit)));
}

async function readResourceConfig(): Promise<HashtagResourceConfig> {
  const fallback: HashtagResourceConfig = { enabled: true, flagEnabled: true, audience: "public", status: "active", visibility: "full", maxItems: 60, cacheMinutes: 360, automaticRefresh: false, indexable: true };
  const admin = createAdminClient();
  if (!admin) return fallback;
  const [{ data: feature, error: featureError }, { data: flag, error: flagError }] = await Promise.all([
    admin.from("product_features").select("enabled,audience,status,visibility,limits,metadata").eq("key", "resource_hashtags").maybeSingle(),
    admin.from("feature_flags").select("enabled").eq("key", "resource_hashtags").maybeSingle(),
  ]);
  if (featureError || flagError || !feature) return fallback;
  const limits = record(feature.limits);
  const metadata = record(feature.metadata);
  return { enabled: feature.enabled === true, flagEnabled: flag?.enabled !== false, audience: feature.audience as ProductFeatureAudience, status: feature.status as ProductFeatureStatus, visibility: feature.visibility as ProductFeatureVisibility, maxItems: Math.max(1, Math.min(100, Number(limits.maxItems ?? fallback.maxItems))), cacheMinutes: Math.max(1, Math.min(10080, Number(limits.cacheMinutes ?? fallback.cacheMinutes))), automaticRefresh: metadata.automaticRefresh === true, indexable: metadata.indexable !== false };
}

const cachedResourceConfig = unstable_cache(readResourceConfig, ["resource-hashtags-config-v1"], { revalidate: 60, tags: ["resource-hashtags-config"] });
export async function getHashtagResourceConfig() { return cachedResourceConfig(); }

export function decideHashtagResourceAccess(config: HashtagResourceConfig, context: { isAuthenticated?: boolean; isPremium?: boolean; isAdmin?: boolean } = {}): HashtagResourceAccess {
  if (!config.enabled || !config.flagEnabled || config.visibility === "hidden" || config.status === "disabled" || config.status === "development") return { available: false, locked: false, reason: "disabled" };
  if (config.audience === "admin" && !context.isAdmin) return { available: true, locked: true, reason: "admin_required" };
  if (config.audience === "premium" && !context.isPremium && !context.isAdmin) return { available: true, locked: true, reason: "premium_required" };
  if (config.audience === "free" && !context.isAuthenticated && !context.isAdmin) return { available: true, locked: true, reason: "authentication_required" };
  return { available: true, locked: config.visibility !== "full", reason: "allowed" };
}

async function readValidHashtagSnapshots(): Promise<PublicHashtagItem[]> {
  const admin = createAdminClient();
  if (!admin) return [];
  const { data: categories, error: categoryError } = await admin.from("content_categories").select("id,slug,name").eq("enabled", true).eq("visible", true).order("position").order("name");
  if (categoryError || !categories?.length) return [];
  const categoryRows = categories as CategoryRow[];
  const { data: snapshots, error } = await admin.from("category_discovery_results").select("category_id,snapshot,fetched_at,expires_at").in("category_id", categoryRows.map((category) => category.id)).eq("result_type", "hashtags").gt("expires_at", new Date().toISOString()).order("fetched_at", { ascending: false }).limit(200);
  if (error || !snapshots) return [];
  const newestByCategory = new Map<string, SnapshotRow>();
  for (const row of snapshots as SnapshotRow[]) if (!newestByCategory.has(row.category_id)) newestByCategory.set(row.category_id, row);
  return categoryRows.flatMap((category) => { const snapshot = newestByCategory.get(category.id); return snapshot ? normalizeHashtagSnapshot(snapshot.snapshot, category, snapshot.fetched_at) : []; });
}

export async function getCachedPublicHashtags(cacheMinutes: number) {
  const minutes = Math.max(1, Math.min(10080, Math.round(cacheMinutes)));
  return unstable_cache(readValidHashtagSnapshots, ["resource-hashtags-data-v1", String(minutes)], { revalidate: minutes * 60, tags: ["resource-hashtags-data"] })();
}
