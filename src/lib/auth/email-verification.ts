import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const RESEND_INTERVAL_MS = 60 * 1000;

export type VerificationEmailResult = "sent" | "throttled" | "unavailable";

function tokenHash(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[character] || character);
}

export async function issueEmailVerification(userId: string, email: string): Promise<VerificationEmailResult> {
  const admin = createAdminClient();
  const apiKey = process.env.RESEND_API_KEY;
  if (!admin || !apiKey) return "unavailable";

  const existing = await admin.from("user_email_verification_tokens").select("created_at").eq("user_id", userId).maybeSingle();
  const lastSentAt = existing.data?.created_at ? new Date(existing.data.created_at).getTime() : 0;
  if (lastSentAt && Date.now() - lastSentAt < RESEND_INTERVAL_MS) return "throttled";

  const token = randomBytes(32).toString("base64url");
  const stored = await admin.from("user_email_verification_tokens").upsert({
    user_id: userId,
    token_hash: tokenHash(token),
    expires_at: new Date(Date.now() + TOKEN_TTL_MS).toISOString(),
    created_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (stored.error) return "unavailable";

  const origin = (process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
  const verificationUrl = `${origin}/verificar-email?token=${encodeURIComponent(token)}`;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.AUTH_EMAIL_FROM || "Alcance IA <onboarding@resend.dev>",
        to: [email],
        subject: "Confirme seu e-mail na Alcance IA",
        text: `Confirme seu e-mail acessando: ${verificationUrl}\n\nEste link expira em 24 horas.`,
        html: `<p>Confirme seu e-mail para concluir a validação da sua conta Alcance IA.</p><p><a href="${escapeHtml(verificationUrl)}">Verificar meu e-mail</a></p><p>Este link expira em 24 horas.</p>`,
      }),
      signal: AbortSignal.timeout(5000),
    });
    return response.ok ? "sent" : "unavailable";
  } catch {
    return "unavailable";
  }
}

export async function verifyEmailToken(token: string) {
  if (!/^[A-Za-z0-9_-]{40,80}$/.test(token)) return false;
  const admin = createAdminClient();
  if (!admin) return false;
  const record = await admin.from("user_email_verification_tokens").select("user_id,expires_at").eq("token_hash", tokenHash(token)).maybeSingle();
  if (!record.data || new Date(record.data.expires_at).getTime() <= Date.now()) return false;
  const updated = await admin.from("user_profiles").update({ email_verified_at: new Date().toISOString() }).eq("user_id", record.data.user_id);
  if (updated.error) return false;
  await admin.from("user_email_verification_tokens").delete().eq("user_id", record.data.user_id);
  return true;
}
