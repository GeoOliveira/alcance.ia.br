import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { EncurtaAccessLevel } from "./types";

export type ShortenerEvent = { requestId: string; accessLevel: EncurtaAccessLevel; userId: string | null; status: "succeeded" | "failed" | "rate_limited"; httpStatus: number; durationMs: number; errorCode?: string; retryCount?: number; idempotentReplay?: boolean };

export async function recordShortenerEvent(event: ShortenerEvent) {
  const admin = createAdminClient();
  if (!admin) return;
  await admin.from("whatsapp_shortener_events").insert({ request_id: event.requestId, access_level: event.accessLevel, user_id: event.userId, status: event.status, http_status: event.httpStatus, duration_ms: Math.max(0, Math.round(event.durationMs)), error_code: event.errorCode ?? null, retry_count: event.retryCount ?? 0, idempotent_replay: event.idempotentReplay === true, environment: process.env.VERCEL_ENV || process.env.NODE_ENV || "unknown", endpoint: "/api/internal/v1/links" });
}

export function maskRequestId(value: string) {
  return value.length <= 10 ? `${value.slice(0, 4)}…` : `${value.slice(0, 8)}…${value.slice(-4)}`;
}
