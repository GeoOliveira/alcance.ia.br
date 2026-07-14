import { createAdminClient } from "@/lib/supabase/admin";
import { contactSchema } from "@/lib/validation/forms";
import { checkRateLimit } from "@/lib/security/rate-limit";
import {
  errorResponse,
  logOperationFailure,
  readJsonBody,
  SafeHttpError,
  successResponse,
} from "@/lib/security/http";
import { idempotencyKey, verifySubmission } from "@/lib/security/submission";
import { getPublicSettings } from "@/lib/settings/get-settings";
import { getPublicFlags } from "@/lib/settings/public-content";
import { isPublicFormAvailable } from "@/lib/settings/availability";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  try {
    const [settings, flags] = await Promise.all([getPublicSettings(), getPublicFlags()]);
    if (!isPublicFormAvailable("contact", settings, flags)) {
      throw new SafeHttpError(503, "contact_unavailable", "O formulário está temporariamente indisponível.");
    }
    const limit = await checkRateLimit(request, "contact");
    if (!limit.available) throw new SafeHttpError(503, "rate_limit_unavailable", "Serviço temporariamente indisponível.");
    if (!limit.allowed) {
      return errorResponse(
        new SafeHttpError(429, "rate_limited", "Limite de mensagens atingido. Tente mais tarde."),
        requestId,
        { "Retry-After": String(limit.retryAfter) },
      );
    }

    const parsed = contactSchema.safeParse(await readJsonBody(request, 8192));
    if (!parsed.success) {
      throw new SafeHttpError(400, "validation_failed", parsed.error.issues[0]?.message || "Revise os campos.");
    }
    await verifySubmission(request, "contact", parsed.data);
    const submissionKey = idempotencyKey(request);
    const admin = createAdminClient();
    if (!admin) throw new SafeHttpError(503, "storage_unavailable", "Serviço temporariamente indisponível.");

    const { name, email, subject, message } = parsed.data;
    const { error } = await admin.from("contact_messages").insert({
      name,
      email,
      subject,
      message,
      idempotency_key: submissionKey,
      privacy_accepted_at: new Date().toISOString(),
      status: "new",
    });
    if (error && error.code !== "23505") {
      logOperationFailure("contact_create", requestId, "database", error.code);
      throw new SafeHttpError(500, "storage_failed", "Não foi possível registrar a mensagem.");
    }

    if (!error && process.env.RESEND_API_KEY && process.env.CONTACT_EMAIL) {
      try {
        const mailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Alcance IA <onboarding@resend.dev>",
            to: [process.env.CONTACT_EMAIL],
            subject: `Contato Alcance IA: ${subject}`,
            text: `Nome: ${name}\nE-mail: ${email}\n\n${message}`,
          }),
          signal: AbortSignal.timeout(5000),
        });
        if (!mailResponse.ok) logOperationFailure("contact_notify", requestId, "provider_http");
      } catch {
        logOperationFailure("contact_notify", requestId, "provider_unavailable");
      }
    }
    return successResponse({ ok: true }, error?.code === "23505" ? 200 : 201, requestId);
  } catch (error) {
    if (error instanceof SafeHttpError) return errorResponse(error, requestId);
    logOperationFailure("contact_create", requestId, "unexpected");
    return errorResponse(new SafeHttpError(500, "unexpected", "Não foi possível concluir o envio."), requestId);
  }
}
