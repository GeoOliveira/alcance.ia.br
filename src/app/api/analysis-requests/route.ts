import { NextResponse } from "next/server";
import { instagramInputSchema } from "@/lib/validation/instagram";
import { parseUtm } from "@/lib/analytics/utm";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, requestFingerprint } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  const limit = checkRateLimit(requestFingerprint(request), 6, 60_000);
  if (!limit.allowed) return NextResponse.json({ error: "Muitas tentativas. Aguarde um minuto e tente novamente." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });
  try {
    const body = await request.json() as Record<string, unknown>;
    if (body.website) return NextResponse.json({ ok: true, requestId: crypto.randomUUID() });
    const parsed = instagramInputSchema.safeParse(body.instagram);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Perfil inválido." }, { status: 400 });
    const admin = createAdminClient();
    if (!admin) return NextResponse.json({ error: "A captura ainda não está conectada. Configure o Supabase para enviar uma solicitação." }, { status: 503 });
    const requestId = crypto.randomUUID(); const username = parsed.data;
    const utm = parseUtm(Object.fromEntries(Object.entries(body).map(([key,value]) => [key, typeof value === "string" ? value : undefined])));
    const { error } = await admin.from("analysis_requests").insert({ id: requestId, instagram_username: username, instagram_profile_url: `https://www.instagram.com/${username}/`, status: "pending", anonymous_session_id: crypto.randomUUID(), ...utm, referrer: typeof body.referrer === "string" ? body.referrer.slice(0,500) : null, landing_page: typeof body.landingPage === "string" ? body.landingPage.slice(0,500) : "/", metadata: { phase: "initial_preview" }, expires_at: new Date(Date.now()+30*24*60*60*1000).toISOString() });
    if (error) { console.error("analysis_request_insert_failed", { code: error.code }); return NextResponse.json({ error: "Não foi possível registrar a solicitação. Tente novamente." }, { status: 500 }); }
    return NextResponse.json({ requestId }, { status: 201 });
  } catch { return NextResponse.json({ error: "Solicitação inválida." }, { status: 400 }); }
}
