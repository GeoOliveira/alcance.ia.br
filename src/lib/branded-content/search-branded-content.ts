import "server-only";
import type { BrandedContentProvider } from "./contracts/provider";
import type { BrandedContentSearchContext, BrandedContentSearchInput } from "./contracts/search-input";
import type { BrandedContentProviderKey } from "./contracts/search-result";
import { metaBrandedContentProvider } from "./providers/meta/adapter";
import { apifyBrandedContentProvider } from "./providers/apify/adapter";
import { getBrandedContentProviderConfig, resolveProvider, type BrandedContentProviderConfig } from "./resolve-provider";
import { shouldFallback } from "./fallback-policy";
import { compareProviderResults } from "./merge-results";

const providers: Record<BrandedContentProviderKey, BrandedContentProvider> = { meta_official: metaBrandedContentProvider, apify: apifyBrandedContentProvider };
function assertEnabled(key: BrandedContentProviderKey, config: BrandedContentProviderConfig, administrative: boolean) { if (key === "meta_official" && !config.metaEnabled) throw new Error("META_DISABLED"); if (key === "apify" && (!config.apifyEnabled || (!administrative && !config.apifyAllowPublicUsage))) throw new Error("APIFY_DISABLED"); }
export async function searchBrandedContent(input: Omit<BrandedContentSearchInput, "resultsLimit">, context: Omit<BrandedContentSearchContext, "cacheMinutes">, override?: { config?: BrandedContentProviderConfig; providers?: Record<BrandedContentProviderKey, BrandedContentProvider> }) {
  const config = override?.config || await getBrandedContentProviderConfig(); const selected = resolveProvider(config, context.administrative); const active = override?.providers || providers;
  const createInput = (provider: BrandedContentProviderKey) => ({ ...input, resultsLimit: Math.min(config.maximumResults, provider === "apify" ? config.apifyResultsLimit : config.maximumResults) }); const createContext = (provider: BrandedContentProviderKey) => ({ ...context, cacheMinutes: provider === "apify" ? config.apifyCacheMinutes : config.metaCacheMinutes, dailyRunLimit: provider === "apify" ? config.apifyDailyRunLimit : undefined });
  if (selected.mode === "admin_compare") { if (!context.administrative || !config.comparisonEnabled) throw new Error("COMPARISON_DISABLED"); assertEnabled("meta_official", config, true); assertEnabled("apify", config, true); const [meta, apify] = await Promise.all([active.meta_official.search(createInput("meta_official"), createContext("meta_official")), active.apify.search(createInput("apify"), createContext("apify"))]); return { result: meta, fallbackUsed: false, comparison: compareProviderResults(meta, apify), compared: { meta, apify } };
  }
  assertEnabled(selected.primary, config, context.administrative);
  try {
    const result = await active[selected.primary].search(createInput(selected.primary), createContext(selected.primary));
    if (!(selected.fallback && config.fallbackOnEmpty && result.response.results.length === 0)) return { result, fallbackUsed: false, comparison: null, compared: null };
  } catch (error) {
    if (!(selected.fallback && shouldFallback(error, config.eligibleErrorCodes))) throw error;
  }
  if (!selected.fallback) throw new Error("FALLBACK_UNAVAILABLE"); assertEnabled(selected.fallback, config, context.administrative); const result = await active[selected.fallback].search(createInput(selected.fallback), createContext(selected.fallback)); return { result, fallbackUsed: true, comparison: null, compared: null };
}
