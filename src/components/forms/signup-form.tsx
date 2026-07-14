"use client";
import { useState } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics/events";

export function SignupForm() {
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setState("loading"); setMessage(""); const form = new FormData(event.currentTarget);
    try { const response = await fetch("/api/signup-interest", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: form.get("name"), email: form.get("email"), password: form.get("password"), termsAccepted: form.get("terms") === "on", privacyAccepted: form.get("privacy") === "on", marketingAccepted: form.get("marketing") === "on" }) }); const data = await response.json() as { error?: string }; if (!response.ok) throw new Error(data.error || "Não foi possível continuar."); setState("success"); trackEvent("signup_completed"); }
    catch (error) { setState("error"); setMessage(error instanceof Error ? error.message : "Tente novamente."); }
  }
  if (state === "success") return <div className="success-state"><span>✓</span><h2>Interesse registrado</h2><p>A autenticação ainda está em preparação. Avisaremos no e-mail informado quando o acesso estiver disponível.</p><Link className="button" href="/obrigado">Continuar</Link></div>;
  return <form className="stacked-form" onSubmit={submit} onFocus={() => trackEvent("signup_started")}><label>Nome<input name="name" required autoComplete="name" maxLength={100} /></label><label>E-mail<input name="email" type="email" required autoComplete="email" maxLength={160} /></label><label>Senha da Alcance IA<input name="password" type="password" required autoComplete="new-password" minLength={8} maxLength={72} /><small>Use pelo menos 8 caracteres.</small></label><div className="security-note">Esta senha será utilizada apenas na sua conta Alcance IA. Nunca solicitamos sua senha do Instagram.</div><label className="check-line"><input name="terms" type="checkbox" required /><span>Aceito os <Link href="/termos-de-uso">Termos de Uso</Link>.</span></label><label className="check-line"><input name="privacy" type="checkbox" required /><span>Aceito a <Link href="/politica-de-privacidade">Política de Privacidade</Link>.</span></label><label className="check-line"><input name="marketing" type="checkbox" /><span>Quero receber novidades e conteúdos da Alcance IA (opcional).</span></label>{state === "error" && <p className="form-error" role="alert">{message}</p>}<button className="button" disabled={state === "loading"}>{state === "loading" ? "Registrando…" : "Criar conta gratuita"}</button><p className="form-caption">Nesta fase, o formulário registra seu interesse. A autenticação será ativada em uma versão futura.</p></form>;
}
