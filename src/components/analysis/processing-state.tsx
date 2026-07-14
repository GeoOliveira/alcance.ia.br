"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics/track";

const steps = ["Preparando sua solicitação", "Validando o perfil informado", "Organizando as informações", "Preparando a prévia"];
export function ProcessingState({ requestId }: { requestId: string }) {
  const [current, setCurrent] = useState(0); const router = useRouter();
  useEffect(() => { trackEvent("analysis_processing_viewed", { request_id: requestId, page_path: window.location.pathname }); }, [requestId]);
  useEffect(() => { const interval = window.setInterval(() => setCurrent((value) => { if (value >= steps.length - 1) { window.clearInterval(interval); window.setTimeout(() => router.push(`/resultado?requestId=${encodeURIComponent(requestId)}`), 650); return value; } return value + 1; }), 720); return () => window.clearInterval(interval); }, [requestId, router]);
  return <div className="process-card" aria-live="polite"><span className="eyebrow">SOLICITAÇÃO RECEBIDA</span><h1>Estamos preparando sua experiência inicial.</h1><p>Esta etapa organiza a navegação e não representa uma consulta ao Instagram ou uma análise real do perfil.</p><div className="process-steps">{steps.map((step, index) => <div className={`process-step ${index === current ? "active" : ""} ${index < current ? "done" : ""}`} key={step}><span className="process-dot">{index < current ? "✓" : index + 1}</span><span>{step}</span></div>)}</div><p className="form-caption">Você será encaminhado para uma demonstração do formato previsto para o relatório.</p></div>;
}
