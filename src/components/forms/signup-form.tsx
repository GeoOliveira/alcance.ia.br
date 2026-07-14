"use client";

import { useState } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics/events";
import { TurnstileField } from "./turnstile-field";
import { useFormProtection } from "./use-form-protection";

export function SignupForm() {
  const protection = useFormProtection("signup");
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!protection.ready) {
      setState("error");
      setMessage(protection.protectionError || "Aguarde a proteção do formulário carregar.");
      return;
    }
    setState("loading");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/signup-interest", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": protection.idempotencyKey.current,
        },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          termsAccepted: form.get("terms") === "on",
          privacyAccepted: form.get("privacy") === "on",
          marketingAccepted: form.get("marketing") === "on",
          website: form.get("website"),
          formToken: protection.formToken,
          turnstileToken: protection.turnstileToken,
        }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error || "Não foi possível continuar.");
      setState("success");
      trackEvent("signup_completed");
      protection.rotateSubmission();
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Tente novamente.");
    }
  }

  const visibleError = message || protection.protectionError;
  return (
    <form className="stacked-form" onSubmit={submit} onFocus={() => trackEvent("signup_started")}>
      <label>Nome<input name="name" required autoComplete="name" maxLength={100} /></label>
      <label>E-mail<input name="email" type="email" required autoComplete="email" maxLength={160} /></label>
      <div className="security-note">Este é um formulário demonstrativo. O envio ainda não está conectado e nenhuma senha é solicitada.</div>
      <label className="check-line"><input name="terms" type="checkbox" required /><span>Aceito os <Link href="/termos-de-uso">Termos de Uso</Link>.</span></label>
      <label className="check-line"><input name="privacy" type="checkbox" required /><span>Aceito a <Link href="/politica-de-privacidade">Política de Privacidade</Link>.</span></label>
      <label className="check-line"><input name="marketing" type="checkbox" /><span>Quero receber novidades e conteúdos da Alcance IA (opcional).</span></label>
      <input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <TurnstileField onToken={protection.setTurnstileToken} />
      {visibleError && <p className="form-error" role="alert">{visibleError}</p>}
      <button className="button" disabled={state === "loading" || !protection.ready}>{state === "loading" ? "Verificando…" : "Verificar disponibilidade"}</button>
      <p className="form-caption">Nenhum dado é salvo nesta fase.</p>
    </form>
  );
}
