import type { BrandedContentSearchResponse } from "@/lib/meta/branded-content/types";

export type BrandedContentProviderKey = "meta_official" | "apify";
export type BrandedContentProviderMode = "meta_only" | "apify_only" | "automatic_fallback" | "admin_compare";
export type BrandedContentProviderResult = {
  response: BrandedContentSearchResponse;
  provider: BrandedContentProviderKey;
  durationMs: number;
  estimatedCost: number;
  runId: string | null;
  datasetId: string | null;
};
