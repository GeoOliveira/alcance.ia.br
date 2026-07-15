import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { productFeatureKeys } from "@/lib/product-features/catalog";

const sessionCookie = "alcance_anonymous_session";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const schema = z.object({ featureKey: z.enum(productFeatureKeys), source: z.enum(["resources_page", "analysis_result", "discovery_page", "branded_content_page"]) });

export async function POST(request: NextRequest) {
  const limit = await checkRateLimit(request, "form-token");
  if (!limit.available) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  if (!limit.allowed) return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
  let input: unknown;
  try { input = await request.json(); } catch { return NextResponse.json({ error: "invalid_json" }, { status: 400 }); }
  const parsed = schema.safeParse(input);
  if (!parsed.success) return NextResponse.json({ error: "validation_failed" }, { status: 400 });
  const admin = createAdminClient();
  if (!admin) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  const existing = request.cookies.get(sessionCookie)?.value;
  const anonymousSessionId = existing && uuid.test(existing) ? existing : crypto.randomUUID();
  const { error } = await admin.from("feature_interest").insert({ feature_key: parsed.data.featureKey, anonymous_session_id: anonymousSessionId, source: parsed.data.source });
  if (error && error.code !== "23505") return NextResponse.json({ error: "storage_failed" }, { status: 500 });
  const response = NextResponse.json({ ok: true });
  if (anonymousSessionId !== existing) response.cookies.set(sessionCookie, anonymousSessionId, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 30 * 86_400 });
  return response;
}
