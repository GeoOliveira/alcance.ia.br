"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics/events";

export function HeroAnalysisForm() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setLoading(true); trackEvent("hero_cta_click");
    try {
      const query = Object.fromEntries(new URLSearchParams(window.location.search));
      const response = await fetch("/api/analysis-requests", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ instagram: value, landingPage: window.location.pathname, referrer: document.referrer, ...query }) });
      const data = await response.json() as { requestId?: string; error?: string };
      if (!response.ok || !data.requestId) throw new Error(data.error || "Não foi possível enviar agora.");
      trackEvent("analysis_request_submitted"); router.push(`/analisar/${data.requestId}`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Tente novamente."); setLoading(false); }
  }
  return <form className="analysis-form" onSubmit={submit} noValidate><label htmlFor="instagram">Seu perfil no Instagram</label><div className="input-action"><span aria-hidden="true">@</span><input id="instagram" name="instagram" value={value} onFocus={() => { if (!started) { setStarted(true); trackEvent("analysis_form_started"); } }} onChange={(e) => setValue(e.target.value)} placeholder="seuusuario ou instagram.com/seuusuario" autoCapitalize="none" autoCorrect="off" required aria-describedby="instagram-help instagram-error" aria-invalid={!!error} /><button className="button" type="submit" disabled={loading}>{loading ? "Enviando…" : "Analisar meu perfil"}<span aria-hidden="true">→</span></button></div><p id="instagram-help" className="form-note"><span aria-hidden="true">✓</span> Não solicitamos sua senha do Instagram. A análise utiliza apenas informações públicas ou dados autorizados pelo usuário.</p>{error && <p id="instagram-error" className="form-error" role="alert">{error}</p>}<input className="honeypot" name="website" tabIndex={-1} autoComplete="off" /></form>;
}
