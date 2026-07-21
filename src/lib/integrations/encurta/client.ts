import "server-only";
import { createEncurtaRequestSignature } from "./signature";
import { getEncurtaConfig } from "./config";
import { EncurtaError } from "./errors";
import { encurtaErrorResponseSchema, encurtaLookupResponseSchema, encurtaResponseSchema } from "./schemas";
import type { EncurtaAccessLevel, EncurtaClientResult, EncurtaLinkSnapshot } from "./types";

const PATH = "/api/internal/v1/links";

function requestIdIsValid(value: string) {
  return /^[A-Za-z0-9][A-Za-z0-9_-]{7,99}$/.test(value);
}

function createRequestId() {
  return `req_${crypto.randomUUID().replaceAll("-", "")}`;
}

export function createEncurtaRequestId() {
  return createRequestId();
}

export async function createEncurtaShortLink(input: {
  phone: string;
  message?: string;
  requestId?: string;
  accessLevel?: EncurtaAccessLevel;
  officialUrl: string;
  externalResourceId?: string;
}): Promise<EncurtaClientResult> {
  const config = getEncurtaConfig();
  if (!config.enabled) throw new EncurtaError("integration_disabled");
  if (!config.configured || !config.apiKey || !config.hmacSecret) throw new EncurtaError("not_configured");
  const requestId = input.requestId && requestIdIsValid(input.requestId) ? input.requestId : createRequestId();
  const body = JSON.stringify({
    destinationType: "whatsapp",
    phone: input.phone,
    ...(input.message ? { message: input.message } : {}),
    externalResourceId: input.externalResourceId ?? "whatsapp_link_generator",
    metadata: { accessLevel: input.accessLevel ?? "anonymous" },
  });
  const timestamp = new Date().toISOString();
  const signature = createEncurtaRequestSignature(config.hmacSecret, { timestamp, method: "POST", path: PATH, requestId, body });
  let attempt = 0;
  while (true) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.timeoutMs);
    try {
      const response = await fetch(`${config.apiUrl}${PATH}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
          "X-Integration-Source": config.source,
          "X-Request-Id": requestId,
          "X-Timestamp": timestamp,
          "X-Signature": signature,
        },
        body,
        cache: "no-store",
        signal: controller.signal,
      });
      const payload: unknown = await response.json().catch(() => null);
      if (response.ok && (response.status === 200 || response.status === 201)) {
        const parsed = encurtaResponseSchema.safeParse(payload);
        if (!parsed.success) throw new EncurtaError("invalid_response", false, response.status);
        return {
          id: parsed.data.data.id,
          slug: parsed.data.data.slug,
          shortUrl: parsed.data.data.shortUrl,
          officialUrl: input.officialUrl,
          status: parsed.data.data.status,
          expiresAt: parsed.data.data.expiresAt,
          createdAt: parsed.data.data.createdAt,
          idempotentReplay: parsed.data.meta?.idempotentReplay === true || response.status === 200,
          retryCount: attempt,
        };
      }
      const external = encurtaErrorResponseSchema.safeParse(payload);
      const code = external.success ? external.data.error?.code : undefined;
      if (response.status === 409 || code === "IDEMPOTENCY_CONFLICT") throw new EncurtaError("idempotency_conflict", false, response.status);
      if (response.status === 429) throw new EncurtaError("rate_limited", false, response.status);
      const retryable = response.status === 502 || response.status === 503 || response.status === 504;
      if (!retryable || attempt >= config.maxRetries) throw new EncurtaError("service_unavailable", retryable, response.status);
    } catch (error) {
      if (error instanceof EncurtaError) {
        if (!error.retryable || attempt >= config.maxRetries) throw new EncurtaError(error.code, error.retryable, error.status, attempt);
      } else if (attempt >= config.maxRetries) {
        throw new EncurtaError(error instanceof DOMException && error.name === "AbortError" ? "timeout" : "service_unavailable", true, undefined, attempt);
      }
    } finally {
      clearTimeout(timer);
    }
    attempt += 1;
  }
}

export async function getEncurtaLinkSnapshot(id: string): Promise<EncurtaLinkSnapshot> {
  const config = getEncurtaConfig();
  if (!config.enabled) throw new EncurtaError("integration_disabled");
  if (!config.configured || !config.apiKey || !config.hmacSecret) throw new EncurtaError("not_configured");
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new EncurtaError("invalid_response");
  const path = `${PATH}/${id}`;
  const requestId = createRequestId();
  const timestamp = new Date().toISOString();
  const signature = createEncurtaRequestSignature(config.hmacSecret, { timestamp, method: "GET", path, requestId, body: "" });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const response = await fetch(`${config.apiUrl}${path}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${config.apiKey}`, "X-Integration-Source": config.source, "X-Request-Id": requestId, "X-Timestamp": timestamp, "X-Signature": signature },
      cache: "no-store",
      signal: controller.signal,
    });
    const payload: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      if (response.status === 429) throw new EncurtaError("rate_limited", false, response.status);
      throw new EncurtaError(response.status >= 500 ? "service_unavailable" : "request_failed", response.status >= 500, response.status);
    }
    const parsed = encurtaLookupResponseSchema.safeParse(payload);
    if (!parsed.success || parsed.data.data.id !== id) throw new EncurtaError("invalid_response", false, response.status);
    return { id: parsed.data.data.id, status: parsed.data.data.status, clickCount: parsed.data.data.clickCount, lastAccessedAt: parsed.data.data.lastAccessedAt };
  } catch (error) {
    if (error instanceof EncurtaError) throw error;
    throw new EncurtaError(error instanceof DOMException && error.name === "AbortError" ? "timeout" : "service_unavailable", true);
  } finally {
    clearTimeout(timer);
  }
}
