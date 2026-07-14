"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics/events";
import { attributionForSubmission } from "@/lib/analytics/attribution";
import { TurnstileField } from "./turnstile-field";
import { useFormProtection } from "./use-form-protection";

export function HeroAnalysisForm({ enabled = true, buttonLabel = "Analisar meu perfil", unavailableMessage = "As solicitações estão temporariamente indisponíveis.", securityNotice = "Não solicitamos sua senha do Instagram. A análise utiliza apenas informações públicas ou dados autorizados pelo usuário." }: { enabled?: boolean; buttonLabel?: string; unavailableMessage?: string; securityNotice?: string }) {
  const router = useRouter();
  const protection = useFormProtection("analysis", enabled);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    trackEvent("analysis_form_viewed", { form_name: "analysis", page_path: window.location.pathname }, { dedupeKey: "analysis_form_viewed", dedupeWindowMs: 30 * 60_000 });
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!enabled) { setError(unavailableMessage); return; }
    if (!protection.ready) {
      setError(protection.protectionError || "Aguarde a proteção do formulário carregar.");
      trackEvent("analysis_form_validation_error", { form_name: "analysis", error_code: "protection_not_ready" });
      return;
    }
    setLoading(true);
    trackEvent("analysis_request_submitted", { form_name: "analysis" });
    const form = new FormData(event.currentTarget);
    let responseStatus = 0;
    try {
      const response = await fetch("/api/analysis-requests", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "idempotency-key": protection.idempotencyKey.current,
        },
        body: JSON.stringify({
          ...attributionForSubmission(),
          instagram: value,
          landingPage: window.location.pathname,
          referrer: document.referrer,
          website: form.get("website"),
          formToken: protection.formToken,
          turnstileToken: protection.turnstileToken,
        }),
      });
      responseStatus = response.status;
      const data = (await response.json()) as { requestId?: string; error?: string };
      if (!response.ok || !data.requestId) {
        const errorCode = `http_${response.status}`;
        if (response.status === 429) trackEvent("analysis_rate_limited", { form_name: "analysis", error_code: errorCode });
        if (response.status === 400) trackEvent("analysis_form_validation_error", { form_name: "analysis", error_code: errorCode });
        trackEvent("analysis_request_failed", { form_name: "analysis", error_code: errorCode });
        throw new Error(data.error || "Não foi possível enviar agora.");
      }
      trackEvent("analysis_request_succeeded", { form_name: "analysis", request_id: data.requestId });
      protection.rotateSubmission();
      router.push(`/analisar/${data.requestId}`);
    } catch (cause) {
      if (responseStatus === 0) trackEvent("analysis_request_failed", { form_name: "analysis", error_code: "network_error" });
      setError(cause instanceof Error ? cause.message : "Tente novamente.");
      setLoading(false);
    }
  }

  const visibleError = error || protection.protectionError;
  return (
    <form className="analysis-form" onSubmit={submit} noValidate data-clarity-mask="true">
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
          disabled={!enabled}
          aria-describedby={visibleError || !enabled ? "instagram-help instagram-error" : "instagram-help"}
          aria-invalid={Boolean(visibleError)}
        />
        <button className="button" type="submit" disabled={!enabled || loading || !protection.ready}>
          {loading ? "Enviando…" : enabled ? buttonLabel : "Indisponível"}<span aria-hidden="true">→</span>
        </button>
      </div>
      <p id="instagram-help" className="form-note">
        <span aria-hidden="true">✓</span> {securityNotice}
      </p>
      {(visibleError || !enabled) && <p id="instagram-error" className="form-error" role="alert">{visibleError || unavailableMessage}</p>}
      <input className="honeypot" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <TurnstileField onToken={protection.setTurnstileToken} />
    </form>
  );
}
