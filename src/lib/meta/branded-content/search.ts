import "server-only";
import { metaGet } from "../client";
import { MetaInvalidResponseError } from "../errors";
import { cacheKey, getCachedSearch, setCachedSearch } from "./cache";
import { normalizeFacebookPageUrl, normalizeInstagramUsername, normalizeResult } from "./normalize";
import { extractAfter } from "./pagination";
import { rawResponseSchema } from "./schemas";
import type { BrandedContentSearchResponse } from "./types";
import type { BrandedContentSearchQuery } from "./validation";

export async function searchBrandedContent(query: BrandedContentSearchQuery, options: { cacheMinutes: number; maxResults: number; paginationEnabled: boolean; signal?: AbortSignal }): Promise<{ response: BrandedContentSearchResponse; durationMs: number }> {
  const identifier = query.platform === "instagram" ? normalizeInstagramUsername(query.username!) : normalizeFacebookPageUrl(query.pageUrl!);
  const key = cacheKey([query.platform, identifier, query.dateMin, query.dateMax, query.after || ""]); const cached = getCachedSearch(key);
  if (cached) return { response: { ...cached, meta: { ...cached.meta, fromCache: true } }, durationMs: 0 };
  const parameters = new URLSearchParams({ creation_date_min: query.dateMin, creation_date_max: query.dateMax, fields: "type,creation_date,creator,partners,url" });
  parameters.set(query.platform === "instagram" ? "ig_username" : "page_url", identifier); if (query.after && options.paginationEnabled) parameters.set("after", query.after);
  const provider = await metaGet("branded_content_search", parameters, options.signal); const parsed = rawResponseSchema.safeParse(provider.body); if (!parsed.success) throw new MetaInvalidResponseError(provider.durationMs);
  const results = await Promise.all(parsed.data.data.slice(0, options.maxResults).map(normalizeResult)); const after = options.paginationEnabled ? extractAfter(parsed.data.paging) : null;
  const response: BrandedContentSearchResponse = { results, pagination: { mode: after ? "cursor" : "none", hasNextPage: Boolean(after), cursor: after, offset: null, after }, meta: { platform: query.platform, queryDisplay: query.platform === "instagram" ? `@${identifier}` : identifier, dateMin: query.dateMin, dateMax: query.dateMax, loadedResults: results.length, fromCache: false, searchedAt: new Date().toISOString() } };
  setCachedSearch(key, response, options.cacheMinutes); return { response, durationMs: provider.durationMs };
}
