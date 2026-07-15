import "server-only";
import { isApifyConfigured } from "@/lib/providers/apify/client";
import type { BrandedContentProvider } from "../../contracts/provider";
import { brandedContentCacheKey, getBrandedContentCache, setBrandedContentCache } from "../../cache";
import { buildApifyInput } from "./input";
import { normalizeApifyItem } from "./normalize";
import { runApifyBrandCollaboration } from "./run";
import { enforceApifyDailyRunLimit } from "../../usage";

export const apifyBrandedContentProvider: BrandedContentProvider = {
  key: "apify",
  async isConfigured() { return isApifyConfigured(); },
  async healthCheck() { const configured = isApifyConfigured(); if(!configured)return{configured:false,available:false,checkedAt:new Date().toISOString(),code:"APIFY_CONFIGURATION"};try{const{client,config}=await import("@/lib/providers/apify/client").then((module)=>module.getApifyClient());const actor=await client.actor(config.actorId).get();return{configured:true,available:Boolean(actor),checkedAt:new Date().toISOString(),code:actor?null:"APIFY_PROVIDER"}}catch{return{configured:true,available:false,checkedAt:new Date().toISOString(),code:"APIFY_PROVIDER"}} },
  async search(input, context) {
    const built = buildApifyInput(input); const source = built.startUrls[0];
    const key = brandedContentCacheKey(["apify", source, input.dateMin, input.dateMax, input.resultsLimit]); const cached = getBrandedContentCache(key);
    if (cached) return { ...cached, response: { ...cached.response, meta: { ...cached.response.meta, fromCache: true } }, durationMs: 0 };
    await enforceApifyDailyRunLimit(context.dailyRunLimit ?? 0);
    const run = await runApifyBrandCollaboration(built, key); const fetchedAt = new Date().toISOString(); const normalized = await Promise.all(run.items.map((item) => normalizeApifyItem(item, fetchedAt))); const results = normalized.filter((item): item is NonNullable<typeof item> => item !== null);
    const queryDisplay = input.platform === "instagram" ? `@${(input.username || "").replace(/^@/, "").toLowerCase()}` : input.pageUrl || "";
    const value = { provider: "apify" as const, durationMs: run.durationMs, estimatedCost: results.length * 0.0034, runId: run.runId, datasetId: run.datasetId, response: { results, pagination: { mode: "complete" as const, hasNextPage: false, cursor: null, offset: null, after: null }, meta: { platform: input.platform, queryDisplay, dateMin: input.dateMin, dateMax: input.dateMax, loadedResults: results.length, fromCache: false, searchedAt: fetchedAt } } };
    setBrandedContentCache(key, value, context.cacheMinutes); return value;
  },
};
