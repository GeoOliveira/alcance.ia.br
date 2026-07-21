import { z } from "zod";
import { getWhatsAppGeneratorConfig } from "@/lib/whatsapp/resource-config";
import { generateWhatsAppLink } from "@/lib/whatsapp/generate-link";
import { createEncurtaShortLink, createEncurtaRequestId, EncurtaError, getShortenerRequestAccess, getShortenerRuntimeSettings, recordShortenerEvent } from "@/lib/integrations/encurta";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { readJsonBody, SafeHttpError, errorResponse, successResponse } from "@/lib/security/http";
import type { ShortenerRequestAccess } from "@/lib/integrations/encurta/runtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const inputSchema = z.strictObject({
  phone: z.string().min(1).max(32),
  message: z.string().max(2000).optional(),
  requestId: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_-]{7,99}$/).optional(),
});

function safeError(error: unknown) {
  if (error instanceof EncurtaError) return { status: error.code === "rate_limited" ? 429 : error.code === "idempotency_conflict" ? 409 : error.code === "not_configured" || error.code === "integration_disabled" ? 503 : 502, message: error.message, code: error.code };
  return { status: 502, message: "Não foi possível criar o link curto.", code: "request_failed" };
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = createEncurtaRequestId();
  let access: ShortenerRequestAccess = { userId: null, level: "anonymous" };
  try {
    access = await getShortenerRequestAccess();
    const config = await getWhatsAppGeneratorConfig(access.level);
    if (!config.access.allowed || !config.flags.shortener) throw new SafeHttpError(503, "shortener_disabled", "O encurtamento está temporariamente indisponível.");
    const runtime = await getShortenerRuntimeSettings(access.level);
    if (!runtime.available) throw new SafeHttpError(503, "rate_limit_unavailable", "O encurtamento está temporariamente indisponível.");
    if (runtime.dailyLimit === 0) throw new SafeHttpError(429, "rate_limited", "O limite de criação de links curtos foi atingido. Utilize o link oficial ou tente novamente mais tarde.");
    const rateLimit = await checkRateLimit(request, "whatsapp-shortener", undefined, { limit: runtime.dailyLimit, windowSeconds: 86_400, ...(access.userId ? { identity: `user:${access.userId}` } : {}) });
    if (!rateLimit.available) throw new SafeHttpError(503, "rate_limit_unavailable", "O encurtamento está temporariamente indisponível.");
    if (!rateLimit.allowed) {
      await recordShortenerEvent({ requestId, accessLevel: access.level, userId: access.userId, status: "rate_limited", httpStatus: 429, durationMs: Date.now() - startedAt, errorCode: "rate_limited" });
      return errorResponse(new SafeHttpError(429, "rate_limited", "O limite de criação de links curtos foi atingido. Utilize o link oficial ou tente novamente mais tarde."), requestId, { "Retry-After": String(rateLimit.retryAfter) });
    }
    const body = await readJsonBody(request, 12_000);
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) throw new SafeHttpError(422, "validation_error", "Revise os dados enviados.");
    const generated = generateWhatsAppLink({ phone: parsed.data.phone, message: parsed.data.message ?? "", messageMaxCharacters: config.messageMaxCharacters });
    const result = await createEncurtaShortLink({
      phone: generated.phone.internationalNumber,
      message: parsed.data.message ?? "",
      requestId: parsed.data.requestId ?? requestId,
      officialUrl: generated.url,
      accessLevel: access.level,
    });
    const { retryCount, ...publicResult } = result;
    await recordShortenerEvent({ requestId, accessLevel: access.level, userId: access.userId, status: "succeeded", httpStatus: 200, durationMs: Date.now() - startedAt, retryCount, idempotentReplay: result.idempotentReplay });
    return successResponse({ data: publicResult }, 200, requestId);
  } catch (error) {
    if (error instanceof SafeHttpError) {
      await recordShortenerEvent({ requestId, accessLevel: access.level, userId: access.userId, status: error.status === 429 ? "rate_limited" : "failed", httpStatus: error.status, durationMs: Date.now() - startedAt, errorCode: error.code });
      return errorResponse(error, requestId);
    }
    const mapped = safeError(error);
    await recordShortenerEvent({ requestId, accessLevel: access.level, userId: access.userId, status: mapped.status === 429 ? "rate_limited" : "failed", httpStatus: mapped.status, durationMs: Date.now() - startedAt, errorCode: mapped.code, retryCount: error instanceof EncurtaError ? error.retryCount : 0 });
    return errorResponse(new SafeHttpError(mapped.status, mapped.code, mapped.message), requestId);
  }
}
