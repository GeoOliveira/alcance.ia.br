"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { safeUserRedirect } from "@/lib/auth/redirect";
import { checkRateLimit } from "@/lib/security/rate-limit";

export type UserAuthState = { ok: boolean; message: string; fieldErrors?: Record<string, string> };

const password = z.string().min(8, "Use pelo menos 8 caracteres.").max(72, "A senha é muito longa.")
  .refine((value) => /[A-Za-z]/.test(value) && /[0-9]/.test(value), "Combine letras e números.");
const email = z.string().trim().email("Informe um e-mail válido.").max(254);

async function authRateLimit(operation: string, limit: number, windowSeconds: number) {
  const incoming = await headers();
  const request = new Request("https://alcance.ia.br/auth", { headers: incoming });
  return checkRateLimit(request, "signup", undefined, { limit, windowSeconds, identity: `${operation}:${incoming.get("x-forwarded-for") || "unknown"}` });
}

export async function loginUserAction(_: UserAuthState, formData: FormData): Promise<UserAuthState> {
  const parsed = z.object({ email, password: z.string().min(1), next: z.string().optional() }).safeParse({
    email: formData.get("email"), password: formData.get("password"), next: formData.get("next") || undefined,
  });
  if (!parsed.success) return { ok: false, message: "Revise o e-mail e a senha." };
  const rate = await authRateLimit("login", 8, 600);
  if (!rate.available || !rate.allowed) return { ok: false, message: "Não foi possível entrar agora. Aguarde e tente novamente." };
  const destination = safeUserRedirect(parsed.data.next);
  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
    if (error) return { ok: false, message: "Não foi possível entrar. Verifique os dados informados." };
  } catch {
    return { ok: false, message: "O acesso está temporariamente indisponível." };
  }
  redirect(destination);
}

export async function registerUserAction(_: UserAuthState, formData: FormData): Promise<UserAuthState> {
  const parsed = z.object({
    name: z.string().trim().min(2, "Informe seu nome.").max(120), email, password,
    confirmation: z.string(), terms: z.literal("on"), privacy: z.literal("on"), marketing: z.boolean(),
  }).refine((value) => value.password === value.confirmation, { path: ["confirmation"], message: "As senhas não coincidem." }).safeParse({
    name: formData.get("name"), email: formData.get("email"), password: formData.get("password"), confirmation: formData.get("confirmation"),
    terms: formData.get("terms"), privacy: formData.get("privacy"), marketing: formData.get("marketing") === "on",
  });
  if (!parsed.success) {
    const fieldErrors = Object.fromEntries(parsed.error.issues.map((issue) => [String(issue.path[0] || "form"), issue.message]));
    return { ok: false, message: "Revise os campos destacados.", fieldErrors };
  }
  const rate = await authRateLimit("registration", 4, 900);
  if (!rate.available || !rate.allowed) return { ok: false, message: "Não foi possível criar a conta agora. Aguarde e tente novamente." };
  try {
    const admin = createAdminClient();
    if (!admin) return { ok: false, message: "O cadastro está temporariamente indisponível." };
    const metadata = { name: parsed.data.name, terms_accepted: true, privacy_accepted: true, marketing_consent: parsed.data.marketing, consent_version: "1" };
    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email: parsed.data.email,
      password: parsed.data.password,
      email_confirm: true,
      user_metadata: metadata,
    });
    if (createError || !created.user) return { ok: false, message: "Não foi possível concluir o cadastro. Revise os dados ou tente novamente." };
    const supabase = await createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
    if (signInError) return { ok: false, message: "A conta foi criada, mas não foi possível iniciar a sessão. Tente entrar novamente." };
  } catch (error) {
    if (typeof error === "object" && error && "digest" in error) throw error;
    return { ok: false, message: "O cadastro está temporariamente indisponível." };
  }
  redirect("/painel");
}

export async function requestUserPasswordResetAction(_: UserAuthState, formData: FormData): Promise<UserAuthState> {
  const parsed = email.safeParse(formData.get("email"));
  const neutral = "Caso exista uma conta associada a este e-mail, enviaremos as instruções de recuperação.";
  if (!parsed.success) return { ok: false, message: "Informe um e-mail válido." };
  const rate = await authRateLimit("password-recovery", 3, 900);
  if (!rate.available || !rate.allowed) return { ok: true, message: neutral };
  try {
    const supabase = await createClient();
    const origin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    await supabase.auth.resetPasswordForEmail(parsed.data, { redirectTo: `${origin}/auth/callback?next=/redefinir-senha` });
  } catch {
    // Resposta neutra evita enumeração de contas.
  }
  return { ok: true, message: neutral };
}

export async function updateUserPasswordAction(_: UserAuthState, formData: FormData): Promise<UserAuthState> {
  const parsed = z.object({ password, confirmation: z.string() })
    .refine((value) => value.password === value.confirmation, { path: ["confirmation"], message: "As senhas não coincidem." })
    .safeParse({ password: formData.get("password"), confirmation: formData.get("confirmation") });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message || "Revise a nova senha." };
  const rate = await authRateLimit("password-update", 4, 900);
  if (!rate.available || !rate.allowed) return { ok: false, message: "Aguarde antes de tentar novamente." };
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: "O link expirou. Solicite uma nova recuperação." };
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    if (error) return { ok: false, message: "Não foi possível atualizar a senha. Solicite um novo link." };
  } catch {
    return { ok: false, message: "Não foi possível atualizar a senha agora." };
  }
  redirect("/entrar?senha=atualizada");
}

export async function logoutUserAction() {
  try { const supabase = await createClient(); await supabase.auth.signOut(); } finally { redirect("/entrar?logout=1"); }
}
