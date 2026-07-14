"use client";

import { useState } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics/events";
import { TurnstileField } from "./turnstile-field";
import { useFormProtection } from "./use-form-protection";

export function ContactForm({ enabled = true }: { enabled?: boolean }) {
  const protection = useFormProtection("contact", enabled);
  const [state, setState] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [started, setStarted] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    if (!enabled) { setState("error"); setMessage("O formulário de contato está temporariamente indisponível."); return; }
    if (!protection.ready) {
      setState("error");
      setMessage(protection.protectionError || "Aguarde a proteção do formulário carregar.");
      return;
    }
    setState("loading");
    trackEvent("contact_form_submitted", { form_name: "contact" });
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      subject: form.get("subject"),
      message: form.get("message"),
      privacyAccepted: form.get("privacy") === "on",
      website: form.get("website"),
      formToken: protection.formToken,
      turnstileToken: protection.turnstileToken,
    };
    let responseStatus = 0;
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": protection.idempotencyKey.current,
        },
        body: JSON.stringify(payload),
      });
      responseStatus = response.status;
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        trackEvent("contact_form_failed", { form_name: "contact", error_code: `http_${response.status}` });
        throw new Error(data.error || "Não foi possível enviar.");
      }
      setState("success");
      trackEvent("contact_form_succeeded", { form_name: "contact" });
      formElement.reset();
      protection.rotateSubmission();
    } catch (error) {
      if (responseStatus === 0) trackEvent("contact_form_failed", { form_name: "contact", error_code: "network_error" });
      setState("error");
      setMessage(error instanceof Error ? error.message : "Tente novamente.");
    }
  }

  if (state === "success") {
    return <div className="success-state" role="status"><span>✓</span><h2>Mensagem recebida</h2><p>Obrigado pelo contato. Sua solicitação foi registrada e responderemos pelo e-mail informado.</p><button className="button button-ghost" onClick={() => setState("idle")}>Enviar outra mensagem</button></div>;
  }
  const visibleError = message || protection.protectionError;
  return (
    <form className="stacked-form" onSubmit={submit} data-clarity-mask="true" onFocus={() => { if (!started) { setStarted(true); trackEvent("contact_form_started", { form_name: "contact" }); } }}>
      <div className="form-row"><Field label="Nome" name="name" autoComplete="name" /><Field label="E-mail" name="email" type="email" autoComplete="email" /></div>
      <label>Assunto<select name="subject" required defaultValue=""><option value="" disabled>Selecione</option><option value="analysis">Dúvidas sobre a análise</option><option value="support">Suporte</option><option value="privacy">Privacidade e dados</option><option value="partnerships">Parcerias</option><option value="press">Imprensa</option><option value="other">Outro</option></select></label>
      <label>Mensagem<textarea name="message" rows={6} minLength={10} maxLength={3000} required placeholder="Conte como podemos ajudar." /></label>
      <label className="check-line"><input type="checkbox" name="privacy" required /><span>Li e aceito a <Link href="/politica-de-privacidade">Política de Privacidade</Link>.</span></label>
      <input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <TurnstileField onToken={protection.setTurnstileToken} />
      {visibleError && <p className="form-error" role="alert">{visibleError}</p>}
      <button className="button" disabled={!enabled || state === "loading" || !protection.ready}>{state === "loading" ? "Enviando…" : enabled ? "Enviar mensagem" : "Indisponível"}</button>
    </form>
  );
}

function Field({ label, name, type = "text", autoComplete }: { label: string; name: string; type?: string; autoComplete?: string }) {
  return <label>{label}<input name={name} type={type} autoComplete={autoComplete} required maxLength={160} /></label>;
}
