import { MetaApiError } from "@/lib/meta/errors";
import { ApifyProviderError } from "./providers/apify/errors";

export const fallbackErrorCodes = ["META_TIMEOUT", "META_INVALID_RESPONSE", "META_PROVIDER", "APIFY_TIMEOUT", "APIFY_INVALID_RESPONSE", "APIFY_PROVIDER"] as const;
export function providerErrorCode(error: unknown) { return error instanceof MetaApiError || error instanceof ApifyProviderError ? error.code : "PROVIDER_UNKNOWN"; }
export function shouldFallback(error: unknown, eligibleCodes: readonly string[]) { const code = providerErrorCode(error); return eligibleCodes.includes(code) && (error instanceof MetaApiError || error instanceof ApifyProviderError) && error.retryable; }
