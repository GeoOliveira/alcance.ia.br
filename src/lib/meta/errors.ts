export type MetaErrorCode = "META_CONFIGURATION" | "META_AUTHENTICATION" | "META_PERMISSION" | "META_RATE_LIMIT" | "META_VALIDATION" | "META_NOT_FOUND" | "META_TIMEOUT" | "META_INVALID_RESPONSE" | "META_PROVIDER";
export class MetaApiError extends Error {
  constructor(public readonly code: MetaErrorCode, public readonly status: number, message: string, public readonly retryable: boolean, public readonly requestId = crypto.randomUUID(), public readonly durationMs = 0, public readonly details: Record<string, string | number | boolean | null> = {}) { super(message); this.name = new.target.name; }
}
export class MetaConfigurationError extends MetaApiError { constructor() { super("META_CONFIGURATION", 503, "O serviço de pesquisa ainda não foi configurado.", false); } }
export class MetaAuthenticationError extends MetaApiError { constructor(durationMs = 0) { super("META_AUTHENTICATION", 502, "A integração com a Meta precisa ser reconfigurada.", false, undefined, durationMs); } }
export class MetaPermissionError extends MetaApiError { constructor(durationMs = 0) { super("META_PERMISSION", 502, "O aplicativo não tem permissão para realizar esta pesquisa.", false, undefined, durationMs); } }
export class MetaRateLimitError extends MetaApiError { constructor(durationMs = 0) { super("META_RATE_LIMIT", 429, "O limite de consultas da Meta foi atingido. Tente novamente mais tarde.", false, undefined, durationMs); } }
export class MetaValidationError extends MetaApiError { constructor(durationMs = 0) { super("META_VALIDATION", 400, "A Meta recusou os parâmetros da pesquisa.", false, undefined, durationMs); } }
export class MetaNotFoundError extends MetaApiError { constructor(durationMs = 0) { super("META_NOT_FOUND", 404, "A conta informada não foi encontrada ou não está disponível.", false, undefined, durationMs); } }
export class MetaTimeoutError extends MetaApiError { constructor(durationMs = 0) { super("META_TIMEOUT", 504, "A Meta demorou demais para responder. Tente novamente.", true, undefined, durationMs); } }
export class MetaInvalidResponseError extends MetaApiError { constructor(durationMs = 0) { super("META_INVALID_RESPONSE", 502, "A Meta retornou uma resposta que não pôde ser processada.", false, undefined, durationMs); } }
export class MetaProviderError extends MetaApiError { constructor(durationMs = 0, retryable = false) { super("META_PROVIDER", 502, "Não foi possível consultar a Meta neste momento. Tente novamente mais tarde.", retryable, undefined, durationMs); } }
export function classifyMetaError(status: number, body: unknown, durationMs: number) {
  const error = body && typeof body === "object" && "error" in body && body.error && typeof body.error === "object" ? body.error as Record<string, unknown> : {};
  const code = typeof error.code === "number" ? error.code : status;
  if (code === 190 || status === 401) return new MetaAuthenticationError(durationMs);
  if ([10, 200, 294].includes(code) || status === 403) return new MetaPermissionError(durationMs);
  if ([4, 17, 32, 613].includes(code) || status === 429) return new MetaRateLimitError(durationMs);
  if (code === 100 || status === 400 || status === 422) return new MetaValidationError(durationMs);
  if (code === 803 || status === 404) return new MetaNotFoundError(durationMs);
  return new MetaProviderError(durationMs, status >= 500);
}
