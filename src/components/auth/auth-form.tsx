"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import type { UserAuthState } from "@/app/(user-auth)/actions";

type Props = {
  action: (state: UserAuthState, formData: FormData) => Promise<UserAuthState>;
  mode: "login" | "register" | "recover" | "reset";
  next?: string;
};

const empty: UserAuthState = { ok: false, message: "" };

export function AuthForm({ action, mode, next }: Props) {
  const [state, formAction, pending] = useActionState(action, empty);
  const [showPassword, setShowPassword] = useState(false);
  const register = mode === "register";
  const login = mode === "login";
  const reset = mode === "reset";
  return <form action={formAction} className="auth-form">
    {next ? <input type="hidden" name="next" value={next} /> : null}
    {register ? <Field label="Nome" name="name" autoComplete="name" error={state.fieldErrors?.name} /> : null}
    {!reset ? <Field label="E-mail" name="email" type="email" autoComplete="email" error={state.fieldErrors?.email} /> : null}
    {(login || register || reset) ? <div className="auth-field">
      <label htmlFor="password">{reset ? "Nova senha" : "Senha"}</label>
      <div className="password-field"><input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete={login ? "current-password" : "new-password"} required minLength={register || reset ? 8 : undefined} aria-describedby={register || reset ? "password-help" : undefined} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? "Ocultar" : "Mostrar"}</button></div>
      {(register || reset) ? <small id="password-help">Use 8 ou mais caracteres, combinando letras e números.</small> : null}
      {state.fieldErrors?.password ? <small className="field-error">{state.fieldErrors.password}</small> : null}
    </div> : null}
    {(register || reset) ? <Field label="Confirmar senha" name="confirmation" type={showPassword ? "text" : "password"} autoComplete="new-password" error={state.fieldErrors?.confirmation} /> : null}
    {login ? <div className="auth-row"><label className="check"><input type="checkbox" name="remember" /> Lembrar acesso</label><Link href="/recuperar-senha">Esqueci minha senha</Link></div> : null}
    {register ? <div className="auth-consents">
      <label className="check"><input type="checkbox" name="terms" required /> Li e aceito os <Link href="/termos-de-uso" target="_blank">Termos de Uso</Link>.</label>
      <label className="check"><input type="checkbox" name="privacy" required /> Li e aceito a <Link href="/politica-de-privacidade" target="_blank">Política de Privacidade</Link>.</label>
      <label className="check"><input type="checkbox" name="marketing" /> Quero receber novidades da Alcance IA (opcional).</label>
    </div> : null}
    <button className="manager-primary auth-submit" disabled={pending}>{pending ? "Aguarde…" : login ? "Entrar" : register ? "Criar minha conta" : reset ? "Atualizar senha" : "Enviar instruções"}</button>
    {state.message ? <p className={state.ok ? "auth-success" : "auth-error"} role="status" aria-live="polite">{state.message}</p> : null}
  </form>;
}

function Field({ label, name, type = "text", autoComplete, error }: { label: string; name: string; type?: string; autoComplete?: string; error?: string }) {
  return <div className="auth-field"><label htmlFor={name}>{label}</label><input id={name} name={name} type={type} autoComplete={autoComplete} required aria-invalid={Boolean(error)} />{error ? <small className="field-error">{error}</small> : null}</div>;
}
