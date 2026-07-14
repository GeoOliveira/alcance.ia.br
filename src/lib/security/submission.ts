import "server-only";
import { SafeHttpError } from "./http";
import { type ProtectedForm, verifyFormToken } from "./form-token";
import { requestIp } from "./rate-limit";
import { verifyTurnstileToken } from "./turnstile";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function idempotencyKey(request: Request) {
  const value = request.headers.get("idempotency-key");
  if (!value || !uuidPattern.test(value)) {
    throw new SafeHttpError(400, "invalid_idempotency_key", "Atualize a página e tente novamente.");
  }
  return value;
}

export async function verifySubmission(
  request: Request,
  form: ProtectedForm,
  fields: { website: string; formToken: string; turnstileToken: string },
) {
  if (fields.website) {
    throw new SafeHttpError(400, "spam_detected", "Não foi possível processar o envio.");
  }

  const formToken = await verifyFormToken(fields.formToken, form);
  if (!formToken.ok) {
    const tooFast = formToken.reason === "too_fast";
    throw new SafeHttpError(
      400,
      `form_token_${formToken.reason}`,
      tooFast ? "Aguarde um instante e tente novamente." : "Atualize a página e tente novamente.",
    );
  }

  const turnstile = await verifyTurnstileToken(fields.turnstileToken, requestIp(request));
  if (!turnstile.ok) {
    throw new SafeHttpError(400, "turnstile_failed", "Confirme a verificação e tente novamente.");
  }
}
