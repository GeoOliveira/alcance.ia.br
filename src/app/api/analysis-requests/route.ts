import { type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { analysisSubmissionSchema } from "@/lib/validation/forms";
import { checkRateLimit } from "@/lib/security/rate-limit";
import {
  errorResponse,
  integerFromEnv,
  logOperationFailure,
  SafeHttpError,
  readJsonBody,
  successResponse,
} from "@/lib/security/http";
import { idempotencyKey, verifySubmission } from "@/lib/security/submission";

const sessionCookie = "alcance_anonymous_session";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  try {
    const limit = await checkRateLimit(request, "analysis");
    if (!limit.available) throw new SafeHttpError(503, "rate_limit_unavailable", "Serviço temporariamente indisponível.");
    if (!limit.allowed) {
      return errorResponse(
        new SafeHttpError(429, "rate_limited", "Muitas tentativas. Aguarde e tente novamente."),
        requestId,
        { "Retry-After": String(limit.retryAfter) },
      );
    }

    const parsed = analysisSubmissionSchema.safeParse(await readJsonBody(request, 4096));
    if (!parsed.success) {
      throw new SafeHttpError(400, "validation_failed", parsed.error.issues[0]?.message || "Revise os campos.");
    }
    await verifySubmission(request, "analysis", parsed.data);
    const submissionKey = idempotencyKey(request);

    const existingSession = request.cookies.get(sessionCookie)?.value;
    const anonymousSessionId = existingSession && uuidPattern.test(existingSession)
      ? existingSession
      : crypto.randomUUID();
    const retentionDays = integerFromEnv("ANALYSIS_RETENTION_DAYS", 30, 1, 365);
    const dedupWindow = integerFromEnv("ANALYSIS_DEDUP_WINDOW_SECONDS", 300, 1, 3600);
    const admin = createAdminClient();
    if (!admin) throw new SafeHttpError(503, "storage_unavailable", "Serviço temporariamente indisponível.");

    const { data, error } = await admin.rpc("create_analysis_request_secure", {
      p_idempotency_key: submissionKey,
      p_instagram_username: parsed.data.instagram,
      p_instagram_profile_url: `https://www.instagram.com/${parsed.data.instagram}/`,
      p_anonymous_session_id: anonymousSessionId,
      p_utm_source: parsed.data.utm_source || null,
      p_utm_medium: parsed.data.utm_medium || null,
      p_utm_campaign: parsed.data.utm_campaign || null,
      p_utm_content: parsed.data.utm_content || null,
      p_utm_term: parsed.data.utm_term || null,
      p_referrer: parsed.data.referrer || null,
      p_landing_page: parsed.data.landingPage,
      p_metadata: { phase: "initial_preview" },
      p_expires_at: new Date(Date.now() + retentionDays * 86_400_000).toISOString(),
      p_dedup_window_seconds: dedupWindow,
    });
    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row || typeof row.request_id !== "string") {
      logOperationFailure("analysis_create", requestId, "database", error?.code);
      throw new SafeHttpError(500, "storage_failed", "Não foi possível registrar a solicitação. Tente novamente.");
    }

    const response = successResponse({ requestId: row.request_id }, row.created === false ? 200 : 201, requestId);
    if (!existingSession || existingSession !== anonymousSessionId) {
      response.cookies.set(sessionCookie, anonymousSessionId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: retentionDays * 86_400,
      });
    }
    return response;
  } catch (error) {
    if (error instanceof SafeHttpError) return errorResponse(error, requestId);
    logOperationFailure("analysis_create", requestId, "unexpected");
    return errorResponse(new SafeHttpError(500, "unexpected", "Não foi possível concluir o envio."), requestId);
  }
}
