export type ApifyErrorCode = "APIFY_CONFIGURATION" | "APIFY_TIMEOUT" | "APIFY_RATE_LIMIT" | "APIFY_INVALID_RESPONSE" | "APIFY_PROVIDER";
export class ApifyProviderError extends Error {
  constructor(public readonly code: ApifyErrorCode, public readonly status: number, message: string, public readonly retryable: boolean, public readonly durationMs = 0) { super(message); this.name = "ApifyProviderError"; }
}
