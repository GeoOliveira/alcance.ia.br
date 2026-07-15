import type { BrandedContentSearchQuery } from "@/lib/meta/branded-content/validation";

export type BrandedContentSearchInput = BrandedContentSearchQuery & { resultsLimit: number };
export type BrandedContentSearchContext = {
  cacheMinutes: number;
  paginationEnabled: boolean;
  signal?: AbortSignal;
  administrative: boolean;
  dailyRunLimit?: number;
};
