import type { AnalysisObservation } from "@/lib/analysis/types";

const actions: Record<string, { impact: string; action: string }> = {
  "few-posts": { impact: "Uma amostra maior torna as comparações mais confiáveis.", action: "Publique com regularidade e analise novamente no futuro." },
  frequency: { impact: "Ritmo previsível facilita acompanhar a resposta do público.", action: "Defina uma cadência simples que possa ser mantida." },
  format: { impact: "Há espaço para aproximar a produção do formato que mais respondeu.", action: "Teste esse formato com mais frequência e compare os próximos resultados." },
  "bio-empty": { impact: "A bio é um dos primeiros pontos de contexto para quem visita o perfil.", action: "Adicione uma descrição curta sobre proposta e público." },
  "bio-cta": { impact: "Um próximo passo claro reduz a dúvida de quem visita o perfil.", action: "Inclua uma chamada objetiva ou um link relevante." },
  comments: { impact: "Comentários sinalizam uma interação mais ativa com o conteúdo.", action: "Experimente perguntas ou convites à conversa nas próximas legendas." },
  balanced: { impact: "Os sinais disponíveis não indicam uma urgência específica.", action: "Continue acompanhando a consistência e amplie a amostra." },
};

export function AnalysisInsightsCard({ observations }: { observations: AnalysisObservation[] }) {
  const priorities = observations.slice(0, 3);
  return <section className="analysis-section analysis-priority-section" id="prioridades"><div className="analysis-section-heading"><span>01</span><div><span className="analysis-heading-kicker">DIAGNÓSTICO INICIAL</span><h2>O que merece atenção</h2><p>Até três prioridades produzidas por regras determinísticas, sem IA.</p></div></div><div className="analysis-priorities">{priorities.map((item, index) => { const detail = actions[item.id] || actions.balanced; return <article data-tone={item.tone} key={item.id}><span className="analysis-priority-number">{String(index + 1).padStart(2, "0")}</span><div><h3>{item.title}</h3><p>{item.message}</p><dl><div><dt>Impacto</dt><dd>{detail.impact}</dd></div><div><dt>Próximo passo</dt><dd>{detail.action}</dd></div></dl></div></article>; })}</div></section>;
}
