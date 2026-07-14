"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, requestPasswordResetAction, updatePasswordAction } from "@/app/admin/actions/auth";
import type { ActionState } from "@/types/admin";

const initialState: ActionState = { ok: false, message: "" };

export function AdminLoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(loginAction, initialState);
  return <form action={action} className="admin-auth-form">
    <input type="hidden" name="next" value={next || "/admin"} />
    <label htmlFor="admin-email">E-mail<input id="admin-email" name="email" type="email" autoComplete="username" required /></label>
    <label htmlFor="admin-password">Senha<input id="admin-password" name="password" type="password" autoComplete="current-password" required minLength={8} /></label>
    {state.message && <p className={state.ok ? "admin-success" : "admin-error"} role="status">{state.message}</p>}
    <button className="admin-primary-button" disabled={pending}>{pending ? "Entrando…" : "Entrar"}</button>
    <Link href="/admin/recuperar-senha">Esqueci minha senha</Link>
  </form>;
}

export function AdminRecoveryForm() {
  const [state, action, pending] = useActionState(requestPasswordResetAction, initialState);
  return <form action={action} className="admin-auth-form">
    <label htmlFor="recovery-email">E-mail<input id="recovery-email" name="email" type="email" autoComplete="email" required /></label>
    {state.message && <p className={state.ok ? "admin-success" : "admin-error"} role="status">{state.message}</p>}
    <button className="admin-primary-button" disabled={pending}>{pending ? "Enviando…" : "Enviar instruções"}</button>
    <Link href="/admin/login">Voltar ao login</Link>
  </form>;
}

export function AdminUpdatePasswordForm() {
  const [state, action, pending] = useActionState(updatePasswordAction, initialState);
  return <form action={action} className="admin-auth-form">
    <label htmlFor="new-password">Nova senha<input id="new-password" name="password" type="password" autoComplete="new-password" required minLength={12} /></label>
    <label htmlFor="password-confirmation">Confirme a senha<input id="password-confirmation" name="confirmation" type="password" autoComplete="new-password" required minLength={12} /></label>
    {state.message && <p className="admin-error" role="status">{state.message}</p>}
    <button className="admin-primary-button" disabled={pending}>{pending ? "Salvando…" : "Atualizar senha"}</button>
  </form>;
}
