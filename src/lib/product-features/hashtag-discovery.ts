import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { scrapeCreatorsFetch } from "@/lib/social-providers/scrape-creators/client";
import { readScrapeCreatorsConfig } from "@/lib/social-providers/scrape-creators/config";
import { ScrapeCreatorsError } from "@/lib/social-providers/scrape-creators/errors";

export type HashtagDiscoveryPeriod = "last-week" | "last-month" | "last-year";
type Trend = "alta" | "estável" | "baixa";
type Popularity = "alta" | "média" | "baixa";
type Category = { id: string; slug: string; name: string; seed_hashtags: string[]; excluded_terms: string[]; refresh_minutes: number };
type SearchPost = { key: string; caption: string; seed?: string; seeds?: string[]; url?: string; thumbnailUrl?: string; username?: string; publishedAt?: string; likes?: number; comments?: number; views?: number };
type PreviousItem = { hashtag?: unknown; occurrences?: unknown };

export type HashtagSnapshotItem = {
  hashtag: string;
  occurrences: number;
  contentsFound: number;
  trend: Trend;
  popularity: Popularity;
  related: string[];
  contentIds: string[];
  updatedAt: string;
};
export type HashtagSnapshotContent = { id: string; url: string; thumbnailUrl: string; caption: string; username: string; publishedAt: string; likes: number; comments: number; views: number };

export type HashtagDiscoverySummary = {
  selectedCategories: number;
  completedCategories: number;
  partialCategories: number;
  failedCategories: number;
  providerCalls: number;
  hashtagsPublished: number;
  dailyLimit: number;
  remainingCalls: number;
};

const asRecord = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const normalizeHashtag = (value: string) => value.normalize("NFKC").trim().toLocaleLowerCase("pt-BR").replace(/^#+/, "").replace(/[^\p{L}\p{N}_]/gu, "").slice(0, 80);
const safeHttpsUrl = (value: unknown) => {
  if (typeof value !== "string") return "";
  try { const url = new URL(value); return url.protocol === "https:" ? url.toString().slice(0, 1000) : ""; } catch { return ""; }
};
const metric = (value: unknown) => { const parsed = Number(value); return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : 0; };
const publishedDate = (value: unknown) => {
  if (typeof value === "number" && Number.isFinite(value)) return new Date(value < 10_000_000_000 ? value * 1000 : value).toISOString();
  if (typeof value === "string" && value) { const parsed = new Date(value); if (!Number.isNaN(parsed.getTime())) return parsed.toISOString(); }
  return "";
};

function postsFromResponse(body: unknown, seed: string): SearchPost[] {
  const source = asRecord(body);
  const rows = [source.posts, source.items, source.results, source.data].find(Array.isArray) as unknown[] | undefined;
  if (!rows) return [];
  return rows.flatMap((value, index) => {
    const post = asRecord(value);
    const owner = asRecord(post.owner);
    const caption = [post.caption, post.text, post.description].find((candidate): candidate is string => typeof candidate === "string") ?? "";
    const identity = [post.id, post.shortcode, post.url, post.display_url].find((candidate): candidate is string | number => typeof candidate === "string" || typeof candidate === "number");
    const shortcode = typeof post.shortcode === "string" ? post.shortcode.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80) : "";
    const directUrl = safeHttpsUrl(post.url ?? post.permalink);
    const url = directUrl || (shortcode ? `https://www.instagram.com/p/${shortcode}/` : "");
    return [{ key: String(identity ?? `${seed}:${index}:${caption.slice(0, 80)}`).slice(0, 160), caption: caption.slice(0, 2000), seed, url, thumbnailUrl: safeHttpsUrl(post.thumbnail_src ?? post.thumbnail_url ?? post.display_url), username: String(owner.username ?? post.username ?? "").replace(/^@/, "").slice(0, 80), publishedAt: publishedDate(post.taken_at ?? post.timestamp ?? post.published_at), likes: metric(post.like_count ?? post.likes), comments: metric(post.comment_count ?? post.comments), views: metric(post.video_view_count ?? post.video_play_count ?? post.view_count ?? post.views) }];
  });
}

function hashtagsForPost(post: SearchPost) {
  const tags = [...post.caption.matchAll(/#([\p{L}\p{N}_]+)/gu)].map((match) => normalizeHashtag(match[1]));
  tags.push(...[post.seed, ...(post.seeds ?? [])].flatMap((seed) => seed ? [normalizeHashtag(seed)] : []));
  return [...new Set(tags.filter(Boolean))];
}

export function buildHashtagSnapshot(input: {
  posts: SearchPost[];
  previousItems?: PreviousItem[];
  excludedTerms?: string[];
  maxItems: number;
  updatedAt: string;
}) {
  const excluded = new Set((input.excludedTerms ?? []).map(normalizeHashtag).filter(Boolean));
  const uniquePostMap = new Map<string, SearchPost>();
  for (const post of input.posts) {
    const current = uniquePostMap.get(post.key);
    if (!current) { uniquePostMap.set(post.key, post); continue; }
    uniquePostMap.set(post.key, {
      key: post.key,
      caption: post.caption.length > current.caption.length ? post.caption : current.caption,
      seeds: [...new Set([current.seed, ...(current.seeds ?? []), post.seed, ...(post.seeds ?? [])].filter((seed): seed is string => Boolean(seed)))],
      url: current.url || post.url, thumbnailUrl: current.thumbnailUrl || post.thumbnailUrl, username: current.username || post.username,
      publishedAt: current.publishedAt || post.publishedAt, likes: Math.max(current.likes ?? 0, post.likes ?? 0), comments: Math.max(current.comments ?? 0, post.comments ?? 0), views: Math.max(current.views ?? 0, post.views ?? 0),
    });
  }
  const uniquePosts = [...uniquePostMap.values()];
  const counts = new Map<string, number>();
  const related = new Map<string, Map<string, number>>();
  const contentIds = new Map<string, string[]>();
  for (const post of uniquePosts) {
    const tags = hashtagsForPost(post).filter((tag) => !excluded.has(tag));
    for (const tag of tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
      const neighbors = related.get(tag) ?? new Map<string, number>();
      for (const candidate of tags) if (candidate !== tag) neighbors.set(candidate, (neighbors.get(candidate) ?? 0) + 1);
      related.set(tag, neighbors);
      if (post.url) contentIds.set(tag, [...new Set([...(contentIds.get(tag) ?? []), post.key])].slice(0, 6));
    }
  }
  const previous = new Map((input.previousItems ?? []).flatMap((item) => {
    const tag = typeof item.hashtag === "string" ? normalizeHashtag(item.hashtag) : "";
    const count = Number(item.occurrences);
    return tag && Number.isFinite(count) ? [[tag, count] as const] : [];
  }));
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR")).slice(0, Math.max(1, Math.min(100, input.maxItems)));
  const highBoundary = Math.max(1, Math.ceil(ranked.length / 3));
  const mediumBoundary = Math.max(highBoundary + 1, Math.ceil(ranked.length * 2 / 3));
  const items: HashtagSnapshotItem[] = ranked.map(([hashtag, occurrences], index) => {
    const old = previous.get(hashtag);
    const change = old && old > 0 ? ((occurrences - old) / old) * 100 : 0;
    const trend: Trend = old === undefined ? "estável" : change > 15 ? "alta" : change < -15 ? "baixa" : "estável";
    const popularity: Popularity = index < highBoundary ? "alta" : index < mediumBoundary ? "média" : "baixa";
    const neighbors = [...(related.get(hashtag)?.entries() ?? [])].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR")).slice(0, 5).map(([tag]) => tag);
    return { hashtag, occurrences, contentsFound: occurrences, trend, popularity, related: neighbors, contentIds: contentIds.get(hashtag) ?? [], updatedAt: input.updatedAt };
  });
  const referencedIds = new Set<string>();
  for (let position = 0; position < 6 && referencedIds.size < 60; position += 1) {
    for (const item of items) {
      const id = item.contentIds[position];
      if (id) referencedIds.add(id);
      if (referencedIds.size >= 60) break;
    }
  }
  const contents = Object.fromEntries(uniquePosts.filter((post) => post.url && referencedIds.has(post.key)).slice(0, 60).map((post): [string, HashtagSnapshotContent] => [post.key, { id: post.key, url: post.url!, thumbnailUrl: post.thumbnailUrl ?? "", caption: post.caption.replace(/\s+/g, " ").trim().slice(0, 280), username: post.username ?? "", publishedAt: post.publishedAt ?? "", likes: post.likes ?? 0, comments: post.comments ?? 0, views: post.views ?? 0 }]));
  const availableIds = new Set(Object.keys(contents));
  for (const item of items) item.contentIds = item.contentIds.filter((id) => availableIds.has(id));
  return { items, contents, sampledPosts: uniquePosts.length };
}

function snapshotItems(value: unknown): PreviousItem[] {
  const source = asRecord(value);
  return Array.isArray(source.items) ? source.items.map(asRecord) : [];
}

async function runCategory(input: { category: Category; seeds: string[]; period: HashtagDiscoveryPeriod; maxItems: number; estimatedCost: number; createdBy: string }) {
  const admin = createAdminClient();
  if (!admin) throw new Error("Cliente administrativo indisponível.");
  const startedAt = Date.now();
  const { data: run, error: runError } = await admin.from("category_discovery_runs").insert({
    feature_key: "category_hashtag_discovery", category_id: input.category.id, endpoint: "instagram/search/hashtag",
    query_snapshot: { seeds: input.seeds, mediaType: "all" }, period: input.period, status: "processing", created_by: input.createdBy,
  }).select("id").single();
  if (runError || !run) throw new Error("Não foi possível registrar a execução.");

  let calls = 0;
  const posts: SearchPost[] = [];
  const errors: string[] = [];
  try {
    const config = readScrapeCreatorsConfig();
    const responses = await Promise.all(input.seeds.map(async (seed) => {
      try {
        const response = await scrapeCreatorsFetch(config, "hashtag_search", "/v1/instagram/search/hashtag", { hashtag: seed, date_posted: input.period, media_type: "all" });
        calls += 1 + response.retries;
        return postsFromResponse(response.body, seed);
      } catch (error) {
        calls += 1 + (error instanceof ScrapeCreatorsError ? Number(error.details.retries ?? 0) : 0);
        errors.push(error instanceof ScrapeCreatorsError ? error.code : "provider_error");
        return [];
      }
    }));
    posts.push(...responses.flat());

    const { data: previous } = await admin.from("category_discovery_results").select("snapshot").eq("category_id", input.category.id).eq("result_type", "hashtags").order("fetched_at", { ascending: false }).limit(1).maybeSingle();
    const now = new Date();
    const built = buildHashtagSnapshot({ posts, previousItems: snapshotItems(previous?.snapshot), excludedTerms: input.category.excluded_terms, maxItems: input.maxItems, updatedAt: now.toISOString() });
    const expiresAt = new Date(now.getTime() + input.category.refresh_minutes * 60_000).toISOString();
    const status = built.items.length ? errors.length ? "partial" : "completed" : "failed";
    if (built.items.length) {
      const snapshot = { version: 2, methodology: "recorrência em posts públicos retornados por hashtags-semente; posts duplicados contam uma vez", period: input.period, sampledPosts: built.sampledPosts, seeds: input.seeds, contents: built.contents, items: built.items };
      const { error } = await admin.from("category_discovery_results").insert({ category_id: input.category.id, result_type: "hashtags", ranking: "relevance", snapshot, item_count: built.items.length, provider: "scrapecreators", provider_calls: calls, fetched_at: now.toISOString(), expires_at: expiresAt });
      if (error) throw new Error("Não foi possível publicar o snapshot.");
    }
    await admin.from("category_discovery_runs").update({ status, items_count: built.items.length, provider_calls: calls, estimated_credit_cost: calls * input.estimatedCost, duration_ms: Date.now() - startedAt, error_code: errors[0] ?? (built.items.length ? null : "empty_result"), completed_at: now.toISOString(), expires_at: built.items.length ? expiresAt : null }).eq("id", run.id);
    return { status, calls, items: built.items.length };
  } catch (error) {
    await admin.from("category_discovery_runs").update({ status: "failed", provider_calls: calls, estimated_credit_cost: calls * input.estimatedCost, duration_ms: Date.now() - startedAt, error_code: error instanceof ScrapeCreatorsError ? error.code : "collection_error", completed_at: new Date().toISOString() }).eq("id", run.id);
    return { status: "failed", calls, items: 0 };
  }
}

export async function collectHashtagDiscovery(input: { createdBy: string; categoryLimit: number; seedsPerCategory: number; period: HashtagDiscoveryPeriod }): Promise<HashtagDiscoverySummary> {
  const admin = createAdminClient();
  if (!admin) throw new Error("A chave administrativa do Supabase não está disponível.");
  const [{ data: feature, error: featureError }, { data: categories, error: categoryError }] = await Promise.all([
    admin.from("product_features").select("enabled,status,limits,estimated_credit_cost").eq("key", "category_hashtag_discovery").maybeSingle(),
    admin.from("content_categories").select("id,slug,name,seed_hashtags,excluded_terms,refresh_minutes").eq("enabled", true).eq("visible", true).order("position").order("name"),
  ]);
  if (featureError || !feature || !feature.enabled || ["disabled", "development"].includes(feature.status)) throw new Error("A descoberta de hashtags está desativada no catálogo.");
  if (categoryError) throw new Error("Não foi possível carregar as categorias.");
  const limits = asRecord(feature.limits);
  const dailyLimit = Math.max(0, Math.min(10000, Number(limits.dailyRequests ?? 0)));
  const maxItems = Math.max(1, Math.min(100, Number(limits.maxItems ?? 20)));
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  const { data: dailyRuns } = await admin.from("category_discovery_runs").select("provider_calls").eq("feature_key", "category_hashtag_discovery").gte("created_at", today.toISOString());
  const usedCalls = (dailyRuns ?? []).reduce((sum, row) => sum + Number(row.provider_calls ?? 0), 0);
  const availableCalls = Math.max(0, dailyLimit - usedCalls);
  const categoryLimit = Math.max(1, Math.min(10, Math.round(input.categoryLimit)));
  const seedsPerCategory = Math.max(1, Math.min(3, Math.round(input.seedsPerCategory)));
  const selectable = (categories as Category[] ?? []).map((category) => ({ ...category, seed_hashtags: (category.seed_hashtags ?? []).map(normalizeHashtag).filter(Boolean) })).filter((category) => category.seed_hashtags.length).slice(0, Math.min(categoryLimit, Math.floor(availableCalls / seedsPerCategory)));
  if (!selectable.length) return { selectedCategories: 0, completedCategories: 0, partialCategories: 0, failedCategories: 0, providerCalls: 0, hashtagsPublished: 0, dailyLimit, remainingCalls: availableCalls };
  const results = await Promise.all(selectable.map((category) => runCategory({ category, seeds: category.seed_hashtags.slice(0, seedsPerCategory), period: input.period, maxItems, estimatedCost: Number(feature.estimated_credit_cost ?? 1), createdBy: input.createdBy })));
  const providerCalls = results.reduce((sum, result) => sum + result.calls, 0);
  return {
    selectedCategories: selectable.length,
    completedCategories: results.filter((result) => result.status === "completed").length,
    partialCategories: results.filter((result) => result.status === "partial").length,
    failedCategories: results.filter((result) => result.status === "failed").length,
    providerCalls,
    hashtagsPublished: results.reduce((sum, result) => sum + result.items, 0),
    dailyLimit,
    remainingCalls: Math.max(0, availableCalls - providerCalls),
  };
}
