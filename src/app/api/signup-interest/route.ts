import { signupSchema } from "@/lib/validation/forms";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { errorResponse, readJsonBody, SafeHttpError } from "@/lib/security/http";
import { idempotencyKey, verifySubmission } from "@/lib/security/submission";
import { getPublicSettings } from "@/lib/settings/get-settings";
import { getPublicFlags } from "@/lib/settings/public-content";
import { isPublicFormAvailable } from "@/lib/settings/availability";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const [settings, flags] = await Promise.all([getPublicSettings(), getPublicFlags()]);
    if (!isPublicFormAvailable("signup", settings, flags)) {
      throw new SafeHttpError(503, "signup_unavailable", "O cadastro ainda não está disponível.");
    }
    const limit = await checkRateLimit(request, "signup");
    if (!limit.available) throw new SafeHttpError(503, "rate_limit_unavailable", "Serviço temporariamente indisponível.");
    if (!limit.allowed) {
      return errorResponse(
        new SafeHttpError(429, "rate_limited", "Muitas tentativas. Aguarde e tente novamente."),
        requestId,
        { "Retry-After": String(limit.retryAfter) },
      );
    }
    const parsed = signupSchema.safeParse(await readJsonBody(request, 4096));
    if (!parsed.success) {
      throw new SafeHttpError(400, "validation_failed", parsed.error.issues[0]?.message || "Revise os campos.");
    }
    await verifySubmission(request, "signup", parsed.data);
    idempotencyKey(request);
    throw new SafeHttpError(
      503,
      "signup_unavailable",
      "O registro de interesse ainda não está conectado. Nenhum dado foi salvo.",
    );
  } catch (error) {
    return errorResponse(
      error instanceof SafeHttpError
        ? error
        : new SafeHttpError(500, "unexpected", "Não foi possível concluir o envio."),
      requestId,
    );
  }
}
