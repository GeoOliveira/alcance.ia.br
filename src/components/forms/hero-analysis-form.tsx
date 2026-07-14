"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics/events";
import { TurnstileField } from "./turnstile-field";
import { useFormProtection } from "./use-form-protection";

export function HeroAnalysisForm() {
  const router = useRouter();
  const protection = useFormProtection("analysis");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!protection.ready) {
      setError(protection.protectionError || "Aguarde a proteção do formulário carregar.");
      return;
    }
    setLoading(true);
    trackEvent("hero_cta_click");
    const form = new FormData(event.currentTarget);
    try {
      const query = Object.fromEntries(new URLSearchParams(window.location.search));
      const response = await fetch("/api/analysis-requests", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": protection.idempotencyKey.current,
        },
        body: JSON.stringify({
          ...query,
          instagram: value,
          landingPage: window.location.pathname,
          referrer: document.referrer,
          website: form.get("website"),
          formToken: protection.formToken,
          turnstileToken: protection.turnstileToken,
        }),
      });
      const data = (await response.json()) as { requestId?: string; error?: string };
      if (!response.ok || !data.requestId) throw new Error(data.error || "Não foi possível enviar agora.");
      trackEvent("analysis_request_submitted");
      protection.rotateSubmission();
      router.push(`/analisar/${data.requestId}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Tente novamente.");
      setLoading(false);
    }
  }

  const visibleError = error || protection.protectionError;
  return (
    <form className="analysis-form" onSubmit={submit} noValidate>
      <label htmlFor="instagram">Seu perfil no Instagram</label>
      <div className="input-action">
        <span aria-hidden="true">@</span>
        <input
          id="instagram"
          name="instagram"
          value={value}
          onFocus={() => {
            if (!started) {
              setStarted(true);
              trackEvent("analysis_form_started");
            }
          }}
          onChange={(event) => setValue(event.target.value)}
          placeholder="seuusuario ou instagram.com/seuusuario"
          autoCapitalize="none"
          autoCorrect="off"
          maxLength={300}
          required
          aria-describedby={visibleError ? "instagram-help instagram-error" : "instagram-help"}
          aria-invalid={Boolean(visibleError)}
        />
        <button className="button" type="submit" disabled={loading || !protection.ready}>
          {loading ? "Enviando…" : "Analisar meu perfil"}<span aria-hidden="true">→</span>
        </button>
      </div>
      <p id="instagram-help" className="form-note">
        <span aria-hidden="true">✓</span> Não solicitamos sua senha do Instagram. A análise utiliza apenas informações públicas ou dados autorizados pelo usuário.
      </p>
      {visibleError && <p id="instagram-error" className="form-error" role="alert">{visibleError}</p>}
      <input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <TurnstileField onToken={protection.setTurnstileToken} />
    </form>
  );
}
