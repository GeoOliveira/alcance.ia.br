import "server-only";
import { z } from "zod";
import type { ProviderEndpoint, ProviderResult, ValidationIssue } from "../contracts/provider-result";
import { scrapeCreatorsFetch } from "./client";
import { readScrapeCreatorsConfig } from "./config";
import { endpointSchemas } from "./schemas";
import { extractItems, inventory, mapPost, mapProfile } from "./mapper";
import { limitStoredData } from "./sanitize";
import { ScrapeCreatorsError } from "./errors";

const paths: Record<ProviderEndpoint, string> = {
  profile: "/v1/instagram/profile", posts: "/v2/instagram/user/posts",
  reels: "/v1/instagram/user/reels", post_details: "/v1/instagram/post",
};

function zodIssues(error: z.ZodError): ValidationIssue[] {
  return error.issues.map((issue) => ({ path: issue.path.join("."), kind: issue.code === "invalid_type" ? "unexpected_type" : "missing", expected: "expected" in issue ? String(issue.expected) : undefined, received: issue.message }));
}
export function normalizeInstagramHandle(input: string) {
  const trimmed = input.trim().replace(/^@/, "").toLowerCase();
  if (!/^(?!.*\.\.)(?!\.)(?!.*\.$)[a-z0-9._]{1,30}$/.test(trimmed)) throw new Error("Nome de usuário do Instagram inválido.");
  return trimmed;
}
export function normalizePostIdentifier(input: string) {
  const trimmed = input.trim();
  const shortcode = /^[a-zA-Z0-9_-]{5,30}$/.test(trimmed) ? trimmed : trimmed.match(/^https:\/\/(?:www\.)?instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]{5,30})(?:\/|\?|$)/)?.[1];
  if (!shortcode) throw new Error("Informe uma URL pública do Instagram ou um shortcode válido.");
  return `https://www.instagram.com/p/${shortcode}/`;
}

export async function fetchFromScrapeCreators(endpoint: ProviderEndpoint, identifierInput: string, maxPages = 1, signal?: AbortSignal): Promise<ProviderResult> {
  const config = readScrapeCreatorsConfig(); const identifier = endpoint === "post_details" ? normalizePostIdentifier(identifierInput) : normalizeInstagramHandle(identifierInput);
  const pageLimit = endpoint === "posts" || endpoint === "reels" ? Math.max(1, Math.min(10, maxPages)) : 1;
  const allItems: unknown[] = []; const rawPages: unknown[] = []; let cursor: string | undefined; let status = 200; let durationMs = 0; let retries = 0; let requestId = "";
  for (let page = 0; page < pageLimit; page += 1) {
    const query = endpoint === "post_details" ? { url: identifier, trim: "false", download_media: "false" } : { handle: identifier, trim: "false", ...(cursor ? { [endpoint === "reels" ? "max_id" : "next_max_id"]: cursor } : {}) };
    let response;
    try { response = await scrapeCreatorsFetch(config, endpoint, paths[endpoint], query, signal); }
    catch (error) {
      if (error instanceof ScrapeCreatorsError && rawPages.length) {
        error.details.partialRaw = limitStoredData(rawPages);
        error.details.partialNormalized = allItems.map(mapPost);
        error.details.completedCalls = rawPages.length;
      }
      throw error;
    }
    status = response.status; durationMs += response.durationMs; retries += response.retries; requestId = response.requestId; rawPages.push(response.body);
    if (endpoint === "profile") break;
    allItems.push(...extractItems(endpoint, response.body)); const root = response.body as Record<string, unknown>;
    const paging = root.paging_info as Record<string, unknown> | undefined; const next = endpoint === "reels" ? paging?.max_id ?? root.next_max_id : root.next_max_id;
    cursor = typeof next === "string" && next ? next : undefined; if (!cursor) break;
  }
  const raw = rawPages.length === 1 ? rawPages[0] : rawPages; const validationTarget = rawPages[0]; const parsed = endpointSchemas[endpoint].safeParse(validationTarget); const issues = parsed.success ? [] : zodIssues(parsed.error); const fetchedAt = new Date().toISOString();
  const data = endpoint === "profile" ? mapProfile(validationTarget, fetchedAt) : endpoint === "post_details" ? (allItems[0] ? mapPost(allItems[0]) : null) : allItems.map(mapPost);
  return { endpoint, identifier, success: true, data, raw: limitStoredData(raw), inventory: inventory(endpoint, validationTarget, issues), validationIssues: issues,
    nextCursor: cursor ?? null, metadata: { requestId, endpoint, httpStatus: status, durationMs, calls: rawPages.length, retries, estimatedCreditCost: rawPages.length, usedCache: false, fetchedAt } };
}
