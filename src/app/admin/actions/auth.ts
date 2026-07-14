"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, passwordRecoverySchema, safeAdminRedirect, updatePasswordSchema } from "@/lib/admin/validation";
import type { ActionState } from "@/types/admin";

const genericLoginError = "Não foi possível entrar. Verifique os dados informados.";

export async function loginAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"), password: formData.get("password"), next: formData.get("next") || undefined,
  });
  if (!parsed.success) return { ok: false, message: genericLoginError };

  let destination = "/admin";
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email: parsed.data.email, password: parsed.data.password });
    if (error || !data.user) return { ok: false, message: genericLoginError };
    const { data: profile } = await supabase.from("admin_profiles")
      .select("is_active").eq("user_id", data.user.id).maybeSingle();
    if (!profile?.is_active) {
      await supabase.auth.signOut();
      return { ok: false, message: genericLoginError };
    }
    await supabase.rpc("record_admin_login");
    destination = safeAdminRedirect(parsed.data.next);
  } catch {
    return { ok: false, message: "O acesso administrativo está temporariamente indisponível." };
  }
  redirect(destination);
}

export async function requestPasswordResetAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = passwordRecoverySchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { ok: false, message: "Informe um e-mail válido." };
  try {
    const supabase = await createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${siteUrl}/admin/auth/callback?next=/admin/recuperar-senha`,
    });
  } catch {
    // A resposta permanece genérica para não revelar contas existentes.
  }
  return { ok: true, message: "Se houver uma conta válida, enviaremos as instruções para redefinir a senha." };
}

export async function updatePasswordAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = updatePasswordSchema.safeParse({
    password: formData.get("password"), confirmation: formData.get("confirmation"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? "Revise a nova senha." };
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { ok: false, message: "O link expirou. Solicite uma nova recuperação." };
    const { data: profile } = await supabase.from("admin_profiles").select("is_active").eq("user_id", user.id).maybeSingle();
    if (!profile?.is_active) return { ok: false, message: "O link expirou. Solicite uma nova recuperação." };
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
    if (error) return { ok: false, message: "Não foi possível atualizar a senha. Solicite um novo link." };
    await supabase.rpc("admin_write_audit", {
      p_action: "admin_password_updated", p_entity_type: "admin_profile", p_entity_id: user.id,
      p_before_data: null, p_after_data: { password_updated: true }, p_metadata: {}, p_request_id: null,
    });
    await supabase.auth.signOut();
  } catch {
    return { ok: false, message: "Não foi possível atualizar a senha agora." };
  }
  redirect("/admin/login?senha=atualizada");
}

export async function logoutAction() {
  try {
    const supabase = await createClient();
    await supabase.rpc("admin_write_audit", {
      p_action: "admin_logout", p_entity_type: "admin_session", p_entity_id: null,
      p_before_data: null, p_after_data: null, p_metadata: {}, p_request_id: null,
    });
    await supabase.auth.signOut();
  } finally {
    redirect("/admin/login");
  }
}
