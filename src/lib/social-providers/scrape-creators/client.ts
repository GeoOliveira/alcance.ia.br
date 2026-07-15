import "server-only";
import type { ProviderEndpoint } from "../contracts/provider-result";
import type { ScrapeCreatorsConfig } from "./config";
import {
  ScrapeCreatorsAuthenticationError, ScrapeCreatorsError, ScrapeCreatorsInvalidResponseError,
  ScrapeCreatorsNotFoundError, ScrapeCreatorsProviderError, ScrapeCreatorsRateLimitError, ScrapeCreatorsTimeoutError,
} from "./errors";

const MAX_RESPONSE_BYTES = 2_000_000;
const retryStatuses = new Set([500, 502, 503, 504]);

export type ClientResponse = { body: unknown; status: number; durationMs: number; retries: number; requestId: string };
export type ScrapeCreatorsEndpoint = ProviderEndpoint | "hashtag_search";

function errorFor(status: number, endpoint: string, requestId: string, durationMs: number) {
  const common = [endpoint, requestId, status, durationMs] as const;
  if (status === 401 || status === 403) return new ScrapeCreatorsAuthenticationError("authentication", "A autenticação com o fornecedor falhou.", false, ...common);
  if (status === 404) return new ScrapeCreatorsNotFoundError("not_found", "O perfil ou conteúdo não foi encontrado.", false, ...common);
  if (status === 429) return new ScrapeCreatorsRateLimitError("rate_limit", "O limite temporário do fornecedor foi atingido.", true, ...common);
  return new ScrapeCreatorsProviderError("provider_error", "O fornecedor não conseguiu concluir a consulta.", retryStatuses.has(status), ...common);
}

async function readJson(response: Response, endpoint: string, requestId: string, durationMs: number) {
  const type = response.headers.get("content-type") || "";
  if (!type.toLowerCase().includes("json")) throw new ScrapeCreatorsInvalidResponseError("invalid_response", "O fornecedor retornou uma resposta não JSON.", false, endpoint, requestId, response.status, durationMs, { contentType: type.slice(0, 100) });
  const declaredSize = Number(response.headers.get("content-length") || "0");
  if (declaredSize > MAX_RESPONSE_BYTES) throw new ScrapeCreatorsInvalidResponseError("invalid_response", "A resposta excedeu o limite seguro.", false, endpoint, requestId, response.status, durationMs, { maxBytes: MAX_RESPONSE_BYTES });
  if (!response.body) throw new ScrapeCreatorsInvalidResponseError("invalid_response", "O fornecedor retornou uma resposta vazia.", false, endpoint, requestId, response.status, durationMs);
  const reader = response.body.getReader(); const chunks: Uint8Array[] = []; let size = 0;
  while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > MAX_RESPONSE_BYTES) { await reader.cancel(); throw new ScrapeCreatorsInvalidResponseError("invalid_response", "A resposta excedeu o limite seguro.", false, endpoint, requestId, response.status, durationMs, { maxBytes: MAX_RESPONSE_BYTES }); } chunks.push(value); }
  const bytes = new Uint8Array(size); let offset = 0; for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try { return JSON.parse(new TextDecoder().decode(bytes)) as unknown; }
  catch { throw new ScrapeCreatorsInvalidResponseError("invalid_response", "O fornecedor retornou JSON inválido.", false, endpoint, requestId, response.status, durationMs); }
}

export async function scrapeCreatorsFetch(config: ScrapeCreatorsConfig, endpoint: ScrapeCreatorsEndpoint, path: string, query: Record<string, string | undefined>, signal?: AbortSignal): Promise<ClientResponse> {
  const requestId = crypto.randomUUID(); let retries = 0; const overallStart = performance.now();
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const timeout = AbortSignal.timeout(config.timeoutMs); const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;
    const url = new URL(path, config.baseUrl); for (const [key, value] of Object.entries(query)) if (value !== undefined) url.searchParams.set(key, value);
    try {
      const response = await fetch(url, { method: "GET", headers: { "x-api-key": config.apiKey, accept: "application/json" }, signal: combined, cache: "no-store" });
      const durationMs = Math.round(performance.now() - overallStart);
      if (!response.ok) {
        const error = errorFor(response.status, endpoint, requestId, durationMs);
        if (attempt === 0 && error.retryable && retryStatuses.has(response.status)) { retries += 1; await new Promise((resolve) => setTimeout(resolve, 250)); continue; }
        throw error;
      }
      const body = await readJson(response, endpoint, requestId, durationMs);
      return { body, status: response.status, durationMs: Math.round(performance.now() - overallStart), retries, requestId };
    } catch (error) {
      if (error instanceof ScrapeCreatorsError) { error.details.retries = retries; throw error; }
      const durationMs = Math.round(performance.now() - overallStart);
      if (combined.aborted) throw new ScrapeCreatorsTimeoutError("timeout", "A consulta ao fornecedor excedeu o tempo limite.", false, endpoint, requestId, null, durationMs);
      throw new ScrapeCreatorsProviderError("provider_error", "Não foi possível conectar ao fornecedor.", false, endpoint, requestId, null, durationMs);
    }
  }
  throw new ScrapeCreatorsProviderError("provider_error", "A consulta não foi concluída.", false, endpoint, requestId);
}
