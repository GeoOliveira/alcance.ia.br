import type { ProviderHealthResult } from "./provider-health";
import type { BrandedContentSearchContext, BrandedContentSearchInput } from "./search-input";
import type { BrandedContentProviderKey, BrandedContentProviderResult } from "./search-result";

export interface BrandedContentProvider {
  key: BrandedContentProviderKey;
  isConfigured(): Promise<boolean>;
  healthCheck(): Promise<ProviderHealthResult>;
  search(input: BrandedContentSearchInput, context: BrandedContentSearchContext): Promise<BrandedContentProviderResult>;
}
