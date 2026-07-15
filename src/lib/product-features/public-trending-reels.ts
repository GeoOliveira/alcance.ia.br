import "server-only";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProductFeatureAudience, ProductFeatureStatus, ProductFeatureVisibility } from "./catalog";

export type TrendingReelSort = "views" | "engagement" | "relative_performance" | "recent";
export type TrendingReelFilters = { period?: "7" | "30" | "90" | "all"; category?: string; language?: string; country?: string; minimumViews?: number; sort?: TrendingReelSort };
export type PublicTrendingReel = {
  id: string;
  thumbnailUrl: string | null;
  author: string;
  caption: string;
  views: number;
  likes: number;
  comments: number;
  publishedAt: string;
  audio: string;
  category: string;
  categorySlug: string;
  language: string | null;
  country: string | null;
  permalink: string;
  engagementRate: number;
  relativePerformance: number | null;
  observedAt: string;
};

export type TrendingReelsResourceConfig = {
  enabled: boolean;
  flagEnabled: boolean;
  audience: ProductFeatureAudience;
  status: ProductFeatureStatus;
  visibility: ProductFeatureVisibility;
  maxItems: number;
  dailyRequests: number;
  cacheMinutes: number;
  automaticRefresh: boolean;
  indexable: boolean;
};

export type TrendingReelsResourceAccess = { available: boolean; locked: boolean; reason: "allowed" | "disabled" | "authentication_required" | "premium_required" | "admin_required" };
type CategoryRow = { id: string; slug: string; name: string; language: string; country: string };
type SnapshotRow = { category_id: string | null; snapshot: unknown; fetched_at: string };

const record = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const textValue = (source: Record<string, unknown>, keys: string[]) => keys.map((key) => source[key]).find((value): value is string => typeof value === "string" && value.trim().length > 0)?.trim() ?? "";
const numberValue = (source: Record<string, unknown>, keys: string[]) => {
  const candidate = keys.map((key) => source[key]).find((value) => typeof value === "number" || (typeof value === "string" && value.trim() !== ""));
  const value = typeof candidate === "number" ? candidate : Number(candidate);
  return Number.isFinite(value) && value >= 0 ? value : 0;
};
const slugValue = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
const safeUrl = (value: string) => { try { const url = new URL(value); return url.protocol === "https:" ? url.toString() : ""; } catch { return ""; } };
const validDate = (value: string, fallback: string) => { const date = new Date(value); return Number.isFinite(date.getTime()) ? date.toISOString() : fallback; };

function itemsFromSnapshot(snapshot: unknown): unknown[] {
  const source = record(snapshot);
  for (const key of ["items", "reels", "results", "data"]) if (Array.isArray(source[key])) return source[key] as unknown[];
  return [];
}

export function normalizeTrendingReelsSnapshot(snapshot: unknown, category: CategoryRow | null, fetchedAt: string): PublicTrendingReel[] {
  return itemsFromSnapshot(snapshot).flatMap((value, index) => {
    const source = record(value);
    const permalink = safeUrl(textValue(source, ["permalink", "url", "reelUrl", "reel_url", "postUrl", "post_url"]));
    if (!permalink) return [];
    const views = Math.round(numberValue(source, ["views", "viewCount", "view_count", "playCount", "play_count", "plays"]));
    const likes = Math.round(numberValue(source, ["likes", "likeCount", "like_count"]));
    const comments = Math.round(numberValue(source, ["comments", "commentCount", "comment_count"]));
    const followers = numberValue(source, ["followers", "followersCount", "followers_count", "authorFollowers", "author_followers"]);
    const suppliedRelative = numberValue(source, ["relativePerformance", "relative_performance", "performanceRatio", "performance_ratio"]);
    const categoryName = textValue(source, ["category", "categoryName", "category_name", "estimatedCategory", "estimated_category"]) || category?.name || "Outros";
    const categorySlug = textValue(source, ["categorySlug", "category_slug"]) || category?.slug || slugValue(categoryName) || "outros";
    const authorRaw = textValue(source, ["author", "username", "ownerUsername", "owner_username", "handle"]);
    const author = authorRaw ? `@${authorRaw.replace(/^@/, "")}` : "Autor público";
    const publishedAt = validDate(textValue(source, ["publishedAt", "published_at", "takenAt", "taken_at", "date", "timestamp"]), fetchedAt);
    const id = textValue(source, ["id", "shortcode", "code", "providerPostId", "provider_post_id"]) || `${slugValue(author)}-${new URL(permalink).pathname}-${index}`;
    return [{
      id,
      thumbnailUrl: safeUrl(textValue(source, ["thumbnailUrl", "thumbnail_url", "thumbnail", "displayUrl", "display_url", "coverUrl", "cover_url"])) || null,
      author,
      caption: textValue(source, ["caption", "description", "text", "title"]) || "Sem legenda pública disponível.",
      views,
      likes,
      comments,
      publishedAt,
      audio: textValue(source, ["audio", "audioTitle", "audio_title", "musicTitle", "music_title", "songName", "song_name"]) || "Áudio não identificado",
      category: categoryName,
      categorySlug,
      language: textValue(source, ["language", "lang", "locale"]) || category?.language || null,
      country: textValue(source, ["country", "countryCode", "country_code"]).toUpperCase() || category?.country || null,
      permalink,
      engagementRate: views > 0 ? (likes + comments) / views : 0,
      relativePerformance: suppliedRelative > 0 ? suppliedRelative : followers > 0 ? views / followers : null,
      observedAt: fetchedAt,
    }];
  });
}

export function filterAndSortTrendingReels(items: PublicTrendingReel[], filters: TrendingReelFilters, maxItems: number, now = new Date()) {
  const period = filters.period ?? "30";
  const cutoff = period === "all" ? Number.NEGATIVE_INFINITY : now.getTime() - Number(period) * 86_400_000;
  const minimumViews = Math.max(0, Number(filters.minimumViews) || 0);
  const sort = filters.sort ?? "views";
  const compare = (a: PublicTrendingReel, b: PublicTrendingReel) => {
    if (sort === "engagement") return b.engagementRate - a.engagementRate || b.views - a.views;
    if (sort === "relative_performance") return (b.relativePerformance ?? -1) - (a.relativePerformance ?? -1) || b.views - a.views;
    if (sort === "recent") return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime() || b.views - a.views;
    return b.views - a.views || b.engagementRate - a.engagementRate;
  };
  return items.filter((item) => new Date(item.publishedAt).getTime() >= cutoff && (!filters.category || item.categorySlug === filters.category) && (!filters.language || item.language === filters.language) && (!filters.country || item.country === filters.country) && item.views >= minimumViews).sort(compare).slice(0, Math.max(1, Math.min(100, maxItems)));
}

async function readResourceConfig(): Promise<TrendingReelsResourceConfig> {
  const fallback: TrendingReelsResourceConfig = { enabled: true, flagEnabled: true, audience: "public", status: "active", visibility: "full", maxItems: 48, dailyRequests: 0, cacheMinutes: 180, automaticRefresh: false, indexable: true };
  const admin = createAdminClient();
  if (!admin) return fallback;
  const [{ data: feature, error: featureError }, { data: flag, error: flagError }] = await Promise.all([
    admin.from("product_features").select("enabled,audience,status,visibility,limits,metadata").eq("key", "resource_trending_reels").maybeSingle(),
    admin.from("feature_flags").select("enabled").eq("key", "resource_trending_reels").maybeSingle(),
  ]);
  if (featureError || flagError || !feature) return fallback;
  const limits = record(feature.limits);
  const metadata = record(feature.metadata);
  return { enabled: feature.enabled === true, flagEnabled: flag?.enabled !== false, audience: feature.audience as ProductFeatureAudience, status: feature.status as ProductFeatureStatus, visibility: feature.visibility as ProductFeatureVisibility, maxItems: Math.max(1, Math.min(100, Number(limits.maxItems ?? fallback.maxItems))), dailyRequests: Math.max(0, Math.min(10000, Number(limits.dailyRequests ?? 0))), cacheMinutes: Math.max(1, Math.min(10080, Number(limits.cacheMinutes ?? fallback.cacheMinutes))), automaticRefresh: metadata.automaticRefresh === true, indexable: metadata.indexable !== false };
}

const cachedResourceConfig = unstable_cache(readResourceConfig, ["resource-trending-reels-config-v1"], { revalidate: 60, tags: ["resource-trending-reels-config"] });
export async function getTrendingReelsResourceConfig() { return cachedResourceConfig(); }

export function decideTrendingReelsResourceAccess(config: TrendingReelsResourceConfig, context: { isAuthenticated?: boolean; isPremium?: boolean; isAdmin?: boolean } = {}): TrendingReelsResourceAccess {
  if (!config.enabled || !config.flagEnabled || config.visibility === "hidden" || config.status === "disabled" || config.status === "development") return { available: false, locked: false, reason: "disabled" };
  if (config.audience === "admin" && !context.isAdmin) return { available: true, locked: true, reason: "admin_required" };
  if (config.audience === "premium" && !context.isPremium && !context.isAdmin) return { available: true, locked: true, reason: "premium_required" };
  if (config.audience === "free" && !context.isAuthenticated && !context.isAdmin) return { available: true, locked: true, reason: "authentication_required" };
  return { available: true, locked: config.visibility !== "full", reason: "allowed" };
}

async function readValidTrendingReels(): Promise<PublicTrendingReel[]> {
  const admin = createAdminClient();
  if (!admin) return [];
  const [{ data: categories, error: categoryError }, { data: snapshots, error: snapshotError }] = await Promise.all([
    admin.from("content_categories").select("id,slug,name,language,country").eq("enabled", true).eq("visible", true),
    admin.from("trending_discovery_results").select("category_id,snapshot,fetched_at").eq("result_type", "reels").gt("expires_at", new Date().toISOString()).order("fetched_at", { ascending: false }).limit(50),
  ]);
  if (categoryError || snapshotError) throw new Error("TRENDING_REELS_SNAPSHOT_READ_FAILED");
  const categoryMap = new Map((categories as CategoryRow[] | null ?? []).map((category) => [category.id, category]));
  const deduplicated = new Map<string, PublicTrendingReel>();
  for (const row of snapshots as SnapshotRow[] | null ?? []) {
    const category = row.category_id ? categoryMap.get(row.category_id) ?? null : null;
    for (const reel of normalizeTrendingReelsSnapshot(row.snapshot, category, row.fetched_at)) if (!deduplicated.has(reel.permalink)) deduplicated.set(reel.permalink, reel);
  }
  return [...deduplicated.values()];
}

export async function getCachedPublicTrendingReels(cacheMinutes: number) {
  const minutes = Math.max(1, Math.min(10080, Math.round(cacheMinutes)));
  return unstable_cache(readValidTrendingReels, ["resource-trending-reels-data-v1", String(minutes)], { revalidate: minutes * 60, tags: ["resource-trending-reels-data"] })();
}
