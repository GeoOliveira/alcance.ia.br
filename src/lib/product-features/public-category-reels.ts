import "server-only";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeTrendingReelsSnapshot, type PublicTrendingReel, type TrendingReelSort } from "./public-trending-reels";
import type { ProductFeatureAudience, ProductFeatureStatus, ProductFeatureVisibility } from "./catalog";

export type CategoryReelFormat = "tutorial" | "talking_head" | "vlog" | "review" | "entertainment" | "other";
export type CategoryReel = PublicTrendingReel & { hashtags: string[]; format: CategoryReelFormat };
export type CategoryReelFilters = {
  query?: string;
  period?: "7" | "30" | "90" | "all";
  category?: string;
  language?: string;
  country?: string;
  minimumViews?: number;
  format?: "" | CategoryReelFormat;
  sort?: TrendingReelSort;
};
export type CategoryReelsConfig = {
  enabled: boolean;
  flagEnabled: boolean;
  audience: ProductFeatureAudience;
  status: ProductFeatureStatus;
  visibility: ProductFeatureVisibility;
  maxItems: number;
  cacheMinutes: number;
  automaticRefresh: boolean;
  indexable: boolean;
  enabledCountries: string[];
  enabledLanguages: string[];
};
export type PublicReelCategory = { id: string; slug: string; name: string; description: string; position: number; language: string; country: string };
export type CategoryReelsAccess = { available: boolean; locked: boolean; reason: "allowed" | "disabled" | "authentication_required" | "premium_required" | "admin_required" };

type CategoryRow = PublicReelCategory;
type ResultRow = { category_id: string; snapshot: unknown; fetched_at: string };
const asRecord = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const stringArray = (value: unknown, fallback: string[]) => Array.isArray(value) ? [...new Set(value.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim()))] : fallback;
const slugify = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const formatValues = new Set<CategoryReelFormat>(["tutorial", "talking_head", "vlog", "review", "entertainment", "other"]);

function snapshotItems(snapshot: unknown) {
  const source = asRecord(snapshot);
  for (const key of ["items", "reels", "results", "data"]) if (Array.isArray(source[key])) return source[key] as unknown[];
  return [];
}

function extraFields(snapshot: unknown, permalink: string) {
  const item = asRecord(snapshotItems(snapshot).find((value) => {
    const candidate = asRecord(value);
    return ["permalink", "url", "reelUrl", "reel_url", "postUrl", "post_url"].some((key) => candidate[key] === permalink || (typeof candidate[key] === "string" && candidate[key] === permalink.replace(/\/$/, "")));
  }));
  const rawHashtags = item.hashtags ?? item.topHashtags ?? item.top_hashtags;
  const hashtags = Array.isArray(rawHashtags)
    ? rawHashtags.filter((tag): tag is string => typeof tag === "string").map((tag) => `#${tag.replace(/^#/, "")}`).slice(0, 5)
    : (typeof rawHashtags === "string" ? rawHashtags.match(/#[\p{L}\p{N}_]+/gu) ?? [] : []);
  const caption = typeof item.caption === "string" ? item.caption : typeof item.description === "string" ? item.description : "";
  const captionHashtags = caption.match(/#[\p{L}\p{N}_]+/gu) ?? [];
  const rawFormat = String(item.format ?? item.contentFormat ?? item.content_format ?? "").trim().toLowerCase().replace(/[ -]+/g, "_") as CategoryReelFormat;
  return {
    permalink,
    hashtags: [...new Set([...hashtags, ...captionHashtags])].slice(0, 5),
    format: formatValues.has(rawFormat) ? rawFormat : "other" as CategoryReelFormat,
  };
}

function normalizeCategorySnapshot(snapshot: unknown, category: CategoryRow, fetchedAt: string): CategoryReel[] {
  return normalizeTrendingReelsSnapshot(snapshot, category, fetchedAt).map((reel) => ({ ...reel, ...extraFields(snapshot, reel.permalink) }));
}

async function readConfig(): Promise<CategoryReelsConfig> {
  const fallback: CategoryReelsConfig = { enabled: true, flagEnabled: true, audience: "public", status: "active", visibility: "full", maxItems: 60, cacheMinutes: 180, automaticRefresh: false, indexable: true, enabledCountries: ["BR"], enabledLanguages: ["pt-BR"] };
  const admin = createAdminClient();
  if (!admin) return fallback;
  const [{ data: feature, error: featureError }, { data: flag, error: flagError }] = await Promise.all([
    admin.from("product_features").select("enabled,audience,status,visibility,limits,metadata").eq("key", "resource_reels_by_category").maybeSingle(),
    admin.from("feature_flags").select("enabled").eq("key", "resource_reels_by_category").maybeSingle(),
  ]);
  if (featureError || flagError || !feature) return fallback;
  const limits = asRecord(feature.limits);
  const metadata = asRecord(feature.metadata);
  return {
    enabled: feature.enabled === true,
    flagEnabled: flag?.enabled !== false,
    audience: feature.audience as ProductFeatureAudience,
    status: feature.status as ProductFeatureStatus,
    visibility: feature.visibility as ProductFeatureVisibility,
    maxItems: Math.max(1, Math.min(100, Number(limits.maxItems ?? fallback.maxItems))),
    cacheMinutes: Math.max(1, Math.min(10080, Number(limits.cacheMinutes ?? fallback.cacheMinutes))),
    automaticRefresh: metadata.automaticRefresh === true,
    indexable: metadata.indexable !== false,
    enabledCountries: stringArray(metadata.enabledCountries, fallback.enabledCountries),
    enabledLanguages: stringArray(metadata.enabledLanguages, fallback.enabledLanguages),
  };
}

const cachedConfig = unstable_cache(readConfig, ["resource-category-reels-config-v1"], { revalidate: 60, tags: ["resource-category-reels-config"] });
export async function getCategoryReelsConfig() { return cachedConfig(); }

export function decideCategoryReelsAccess(config: CategoryReelsConfig, context: { isAuthenticated?: boolean; isPremium?: boolean; isAdmin?: boolean } = {}): CategoryReelsAccess {
  if (!config.enabled || !config.flagEnabled || config.visibility === "hidden" || config.status === "disabled" || config.status === "development") return { available: false, locked: false, reason: "disabled" };
  if (config.audience === "admin" && !context.isAdmin) return { available: true, locked: true, reason: "admin_required" };
  if (config.audience === "premium" && !context.isPremium && !context.isAdmin) return { available: true, locked: true, reason: "premium_required" };
  if (config.audience === "free" && !context.isAuthenticated && !context.isAdmin) return { available: true, locked: true, reason: "authentication_required" };
  return { available: true, locked: config.visibility !== "full", reason: "allowed" };
}

async function readCategories(config: CategoryReelsConfig): Promise<PublicReelCategory[]> {
  const admin = createAdminClient();
  if (!admin) return [];
  let query = admin.from("content_categories").select("id,slug,name,description,position,language,country").eq("enabled", true).eq("visible", true).order("position").order("name");
  if (config.enabledCountries.length) query = query.in("country", config.enabledCountries);
  if (config.enabledLanguages.length) query = query.in("language", config.enabledLanguages);
  const { data, error } = await query;
  return error ? [] : data as PublicReelCategory[];
}

export async function getActiveReelCategories(config: CategoryReelsConfig) {
  return unstable_cache(() => readCategories(config), ["resource-category-reels-categories-v1", config.enabledCountries.join("-"), config.enabledLanguages.join("-")], { revalidate: 60, tags: ["resource-category-reels-data"] })();
}

async function readReels(config: CategoryReelsConfig, categories: PublicReelCategory[]): Promise<CategoryReel[]> {
  const admin = createAdminClient();
  if (!admin || !categories.length) return [];
  const { data, error } = await admin.from("category_discovery_results").select("category_id,snapshot,fetched_at").in("category_id", categories.map((category) => category.id)).eq("result_type", "reels").gt("expires_at", new Date().toISOString()).order("fetched_at", { ascending: false }).limit(100);
  if (error) return [];
  const categoryMap = new Map(categories.map((category) => [category.id, category]));
  const deduplicated = new Map<string, CategoryReel>();
  for (const row of data as ResultRow[]) {
    const category = categoryMap.get(row.category_id);
    if (!category) continue;
    for (const reel of normalizeCategorySnapshot(row.snapshot, category, row.fetched_at)) if (!deduplicated.has(reel.permalink)) deduplicated.set(reel.permalink, reel);
  }
  return [...deduplicated.values()].slice(0, config.maxItems);
}

export async function getCachedCategoryReels(config: CategoryReelsConfig, categories: PublicReelCategory[]) {
  return unstable_cache(() => readReels(config, categories), ["resource-category-reels-data-v1", String(config.cacheMinutes), categories.map((item) => item.id).join("-")], { revalidate: config.cacheMinutes * 60, tags: ["resource-category-reels-data"] })();
}

export function filterCategoryReels(items: CategoryReel[], filters: CategoryReelFilters, maxItems: number, now = new Date()) {
  const query = slugify(filters.query ?? "");
  const cutoff = filters.period === "all" ? Number.NEGATIVE_INFINITY : now.getTime() - Number(filters.period ?? "30") * 86_400_000;
  const filtered = items.filter((item) => {
    const searchable = slugify([item.caption, item.author, item.category, item.audio, ...item.hashtags].join(" "));
    return (!query || searchable.includes(query)) && new Date(item.publishedAt).getTime() >= cutoff && (!filters.category || item.categorySlug === filters.category) && (!filters.language || item.language === filters.language) && (!filters.country || item.country === filters.country) && (!filters.format || item.format === filters.format) && item.views >= Math.max(0, Number(filters.minimumViews) || 0);
  });
  const sort = filters.sort ?? "views";
  return filtered.sort((a, b) => sort === "engagement" ? b.engagementRate - a.engagementRate || b.views - a.views : sort === "relative_performance" ? (b.relativePerformance ?? -1) - (a.relativePerformance ?? -1) || b.views - a.views : sort === "recent" ? new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime() : b.views - a.views || b.engagementRate - a.engagementRate).slice(0, Math.max(1, Math.min(100, maxItems)));
}
