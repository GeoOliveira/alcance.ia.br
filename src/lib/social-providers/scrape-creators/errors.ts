export type ScrapeCreatorsErrorCode = "configuration" | "authentication" | "rate_limit" | "not_found" | "private_profile" | "timeout" | "invalid_response" | "provider_error";

export class ScrapeCreatorsError extends Error {
  constructor(
    public readonly code: ScrapeCreatorsErrorCode,
    message: string,
    public readonly retryable: boolean,
    public readonly endpoint: string,
    public readonly requestId: string,
    public readonly httpStatus: number | null = null,
    public readonly durationMs = 0,
    public readonly details: Record<string, unknown> = {},
  ) { super(message); this.name = this.constructor.name; }
}
export class ScrapeCreatorsConfigurationError extends ScrapeCreatorsError {}
export class ScrapeCreatorsAuthenticationError extends ScrapeCreatorsError {}
export class ScrapeCreatorsRateLimitError extends ScrapeCreatorsError {}
export class ScrapeCreatorsNotFoundError extends ScrapeCreatorsError {}
export class ScrapeCreatorsPrivateProfileError extends ScrapeCreatorsError {}
export class ScrapeCreatorsTimeoutError extends ScrapeCreatorsError {}
export class ScrapeCreatorsInvalidResponseError extends ScrapeCreatorsError {}
export class ScrapeCreatorsProviderError extends ScrapeCreatorsError {}
