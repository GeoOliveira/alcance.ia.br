import "server-only";
import { isMetaConfigured } from "@/lib/meta/config";
import { searchBrandedContent as searchMeta } from "@/lib/meta/branded-content/search";
import type { BrandedContentProvider } from "../../contracts/provider";

export const metaBrandedContentProvider: BrandedContentProvider = {
  key: "meta_official",
  async isConfigured() { return isMetaConfigured(); },
  async healthCheck() { const configured = isMetaConfigured(); return { configured, available: configured, checkedAt: new Date().toISOString(), code: configured ? null : "META_CONFIGURATION" }; },
  async search(input, context) {
    const result = await searchMeta(input, { cacheMinutes: context.cacheMinutes, maxResults: input.resultsLimit, paginationEnabled: context.paginationEnabled, signal: context.signal });
    return { ...result, provider: "meta_official", estimatedCost: 0, runId: null, datasetId: null };
  },
};
