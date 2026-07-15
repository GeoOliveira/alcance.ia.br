import type { BrandedContentProviderResult } from "./contracts/search-result";
import { getBrandedContentDeduplicationKey } from "./deduplicate";
export function compareProviderResults(meta: BrandedContentProviderResult, apify: BrandedContentProviderResult) {
  const metaKeys = new Set(meta.response.results.map(getBrandedContentDeduplicationKey)); const apifyKeys = new Set(apify.response.results.map(getBrandedContentDeduplicationKey)); const common = [...metaKeys].filter((key) => apifyKeys.has(key)).length;
  return { metaCount: metaKeys.size, apifyCount: apifyKeys.size, common, metaExclusive: metaKeys.size - common, apifyExclusive: apifyKeys.size - common, duplicationRate: Math.max(metaKeys.size, apifyKeys.size) ? common / Math.max(metaKeys.size, apifyKeys.size) : 0, metaDurationMs: meta.durationMs, apifyDurationMs: apify.durationMs, estimatedApifyCost: apify.estimatedCost };
}
