"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { trackEvent } from "@/lib/analytics/track";
import { analysisStageLabels } from "@/lib/analysis/analysis-status";
import type { AnalysisStage } from "@/lib/analysis/types";

const stages: AnalysisStage[] = ["queued", "profile", "content", "metrics", "complete"];

export function AnalysisLoadingState({ requestId, initialStage }: { requestId: string; initialStage: AnalysisStage }) {
  const router = useRouter();
  const [stage, setStage] = useState(initialStage);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    trackEvent("analysis_processing_viewed", { request_id: requestId, page_path: window.location.pathname });
    let active = true;
    const process = fetch(`/api/analysis-requests/${requestId}`, { method: "POST" }).then(() => { if (active) router.refresh(); }).catch(() => { if (active) setFailed(true); });
    const poll = window.setInterval(async () => { try { const response = await fetch(`/api/analysis-requests/${requestId}`, { cache: "no-store" }); if (!response.ok) return; const data = await response.json() as { stage: AnalysisStage; state: string }; if (!active) return; setStage(data.stage); if (!["waiting", "processing"].includes(data.state)) { window.clearInterval(poll); router.refresh(); } } catch { /* a requisição principal ainda pode concluir */ } }, 1200);
    return () => { active = false; window.clearInterval(poll); void process; };
  }, [requestId, router]);

  const current = stages.indexOf(stage);
  return <section className="analysis-loading" aria-live="polite"><div className="analysis-loading-copy"><span className="eyebrow">ANÁLISE EM ANDAMENTO</span><h1>Transformando sinais públicos em uma leitura clara.</h1><p>Você pode manter esta página aberta. O resultado aparecerá assim que os dados forem organizados.</p>{failed && <p className="analysis-inline-error">A conexão oscilou. Continuaremos verificando o estado da análise.</p>}<div className="analysis-real-steps">{stages.slice(0, -1).map((item, index) => <div className={index < current ? "done" : index === current ? "active" : ""} key={item}><span>{index < current ? "✓" : index + 1}</span><div><strong>{analysisStageLabels[item]}</strong><small>{index < current ? "Concluído" : index === current ? "Em andamento" : "Aguardando"}</small></div></div>)}</div></div><div className="analysis-skeleton" aria-hidden="true"><div className="analysis-skeleton-header"><span /><span /></div><div className="analysis-skeleton-highlight"><span /><span /><span /></div><div className="analysis-skeleton-grid"><span /><span /><span /></div><div className="analysis-skeleton-lines"><span /><span /><span /></div></div></section>;
}
