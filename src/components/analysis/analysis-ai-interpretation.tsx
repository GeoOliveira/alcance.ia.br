import type { AIProfileAnalysisOutput } from "@/lib/ai/contracts/ai-analysis-output";

export function AnalysisAIInterpretation({ analysis, visibility }: { analysis: AIProfileAnalysisOutput; visibility: "preview" | "full" }) {
  const opportunities = visibility === "full" ? analysis.opportunities : analysis.opportunities.slice(0, 1);
  const ideas = visibility === "full" ? analysis.contentIdeas : analysis.contentIdeas.slice(0, 2);
  return <section className="analysis-ai" id="interpretacao-ia" aria-labelledby="analysis-ai-title">
    <div className="analysis-ai-heading"><span>INTERPRETAÇÃO ASSISTIDA POR IA</span><h2 id="analysis-ai-title">{analysis.summary.headline}</h2><p>{analysis.summary.overview}</p></div>
    <p className="analysis-ai-notice">Este conteúdo foi gerado por inteligência artificial a partir de métricas determinísticas e dados públicos sanitizados. Pode conter imprecisões e não substitui o Instagram Insights nem garante resultados.</p>
    {analysis.bioAnalysis.available && <article><h3>Leitura da bio</h3><p>{analysis.bioAnalysis.currentBioSummary}</p>{analysis.bioAnalysis.suggestedBio && <><h4>Sugestão de bio</h4><blockquote>{analysis.bioAnalysis.suggestedBio}</blockquote></>}</article>}
    {opportunities.length > 0 && <div><h3>Prioridades recomendadas</h3><div className="analysis-ai-grid">{opportunities.map((item) => <article key={item.title}><span>{item.priority === "high" ? "Alta prioridade" : item.priority === "medium" ? "Prioridade média" : "Prioridade baixa"}</span><h4>{item.title}</h4><p>{item.explanation}</p><strong>Próximo passo</strong><p>{item.suggestedAction}</p></article>)}</div></div>}
    {ideas.length > 0 && <div><h3>Ideias iniciais de conteúdo</h3><div className="analysis-ai-grid">{ideas.map((idea) => <article key={idea.title}><span>{idea.format}</span><h4>{idea.title}</h4><p>{idea.concept}</p>{idea.suggestedHook && <p><strong>Gancho:</strong> {idea.suggestedHook}</p>}</article>)}</div></div>}
    {visibility === "preview" && (analysis.opportunities.length > opportunities.length || analysis.contentIdeas.length > ideas.length) && <p className="analysis-ai-preview">Prévia: outras recomendações permanecem ocultas nesta configuração.</p>}
    <details><summary>Limitações desta interpretação</summary><ul>{analysis.limitations.map((item) => <li key={item}>{item}</li>)}</ul></details>
  </section>;
}
