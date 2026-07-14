import { checkRateLimit } from "@/lib/security/rate-limit";
import { issueFormToken, isProtectedForm } from "@/lib/security/form-token";
import { errorResponse, SafeHttpError, successResponse } from "@/lib/security/http";

export async function GET(request: Request) {
  const requestId = crypto.randomUUID();
  const limit = await checkRateLimit(request, "form-token");
  if (!limit.available) {
    return errorResponse(
      new SafeHttpError(503, "rate_limit_unavailable", "Serviço temporariamente indisponível."),
      requestId,
    );
  }
  if (!limit.allowed) {
    return errorResponse(
      new SafeHttpError(429, "rate_limited", "Muitas tentativas. Aguarde e tente novamente."),
      requestId,
      { "Retry-After": String(limit.retryAfter) },
    );
  }

  const form = new URL(request.url).searchParams.get("form");
  if (!isProtectedForm(form)) {
    return errorResponse(new SafeHttpError(400, "invalid_form", "Formulário inválido."), requestId);
  }

  const token = await issueFormToken(form);
  if (!token) {
    return errorResponse(
      new SafeHttpError(503, "token_unavailable", "Serviço temporariamente indisponível."),
      requestId,
    );
  }
  return successResponse({ token }, 200, requestId);
}
