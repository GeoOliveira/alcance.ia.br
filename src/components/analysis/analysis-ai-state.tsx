"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AIProfileAnalysisOutput } from "@/lib/ai/contracts/ai-analysis-output";
import type { AIAnalysisPublicState } from "@/lib/analysis/types";
import { AnalysisAIInterpretation } from "./analysis-ai-interpretation";

export function AnalysisAIState({ requestId, initialState, analysis, visibility }: { requestId: string; initialState: AIAnalysisPublicState; analysis?: AIProfileAnalysisOutput; visibility?: "preview" | "full" }) {
  const router = useRouter();
  const [state, setState] = useState(initialState);

  useEffect(() => {
    if (!['preparing', 'processing'].includes(state)) return;
    let active = true;
    const poll = window.setInterval(async () => {
      try {
        const response = await fetch(`/api/analysis-requests/${requestId}`, { cache: "no-store" });
        if (!response.ok) return;
        const data = await response.json() as { aiState?: AIAnalysisPublicState | null };
        if (!active || !data.aiState) return;
        setState(data.aiState);
        if (data.aiState === "completed") { window.clearInterval(poll); router.refresh(); }
        if (data.aiState === "failed") window.clearInterval(poll);
      } catch { /* a análise determinística permanece disponível */ }
    }, 1800);
    return () => { active = false; window.clearInterval(poll); };
  }, [requestId, router, state]);

  if (state === "completed" && analysis && visibility) return <AnalysisAIInterpretation analysis={analysis} visibility={visibility} />;
  if (state === "failed") return <section className="analysis-ai analysis-ai-status" id="insights-inteligentes" aria-live="polite"><span>INSIGHTS INTELIGENTES</span><h2>Os insights não puderam ser concluídos.</h2><p>As métricas e o plano determinístico acima continuam válidos. A interpretação por IA poderá ser tentada novamente sem refazer a coleta do Instagram.</p></section>;
  return <section className="analysis-ai analysis-ai-status" id="insights-inteligentes" aria-live="polite" aria-busy="true"><div className="analysis-ai-spinner" aria-hidden="true" /><div><span>INSIGHTS INTELIGENTES</span><h2>Preparando insights</h2><p>A análise determinística já está disponível. Estamos organizando a interpretação por IA e esta seção será atualizada automaticamente.</p></div><div className="analysis-ai-status-steps" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div></section>;
}
