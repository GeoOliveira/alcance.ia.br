import "server-only";
import { getMetaConfig } from "./config";
import { classifyMetaError, MetaApiError, MetaInvalidResponseError, MetaProviderError, MetaTimeoutError } from "./errors";
import type { MetaRequestResult } from "./types";

export async function metaGet(path: string, parameters: URLSearchParams, signal?: AbortSignal): Promise<MetaRequestResult> {
  const config = getMetaConfig();
  const url = new URL(`${config.version}/${path.replace(/^\//, "")}`, `${config.url.replace(/\/$/, "")}/`);
  parameters.forEach((value, key) => url.searchParams.set(key, value));
  url.searchParams.set("access_token", config.token);
  let lastError: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const started = Date.now();
    try {
      const response = await fetch(url, { signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(config.timeoutMs)]) : AbortSignal.timeout(config.timeoutMs), cache: "no-store", headers: { Accept: "application/json" } });
      const durationMs = Date.now() - started;
      const text = await response.text();
      let body: unknown;
      try { body = text ? JSON.parse(text) : null; } catch { throw new MetaInvalidResponseError(durationMs); }
      if (!response.ok) {
        const error = classifyMetaError(response.status, body, durationMs);
        if (error.retryable && attempt === 0) { lastError = error; continue; }
        throw error;
      }
      return { body, durationMs, providerRequestId: response.headers.get("x-fb-trace-id") };
    } catch (error) {
      if (error instanceof MetaApiError) { if (error.retryable && attempt === 0) { lastError = error; continue; } throw error; }
      if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) throw new MetaTimeoutError(Date.now() - started);
      throw new MetaProviderError(Date.now() - started);
    }
  }
  throw lastError instanceof Error ? lastError : new MetaProviderError();
}
