import type { AIProfileAnalysisOutput } from "@/lib/ai/contracts/ai-analysis-output";

const confidenceLabels = { low: "Confiança baixa", medium: "Confiança média", high: "Confiança alta" } as const;
const priorityLabels = { high: "Alta prioridade", medium: "Prioridade média", low: "Prioridade baixa" } as const;
const formatLabels = { reel: "Reel", carousel: "Carrossel", image: "Imagem", story: "Story", other: "Outro formato" } as const;

export function AnalysisAIInterpretation({ analysis, visibility }: { analysis: AIProfileAnalysisOutput; visibility: "preview" | "full" }) {
  const strengths = visibility === "full" ? analysis.strengths : analysis.strengths.slice(0, 1);
  const opportunities = visibility === "full" ? analysis.opportunities : analysis.opportunities.slice(0, 1);
  const ideas = visibility === "full" ? analysis.contentIdeas : analysis.contentIdeas.slice(0, 2);
  const planExplanations = visibility === "full" ? analysis.actionPlanExplanation : analysis.actionPlanExplanation.slice(0, 1);
  const hasPreviewLimit = visibility === "preview" && (analysis.strengths.length > strengths.length || analysis.opportunities.length > opportunities.length || analysis.contentIdeas.length > ideas.length || analysis.actionPlanExplanation.length > planExplanations.length);

  return <section className="analysis-ai" id="insights-inteligentes" aria-labelledby="analysis-ai-title">
    <header className="analysis-ai-heading"><span>INTERPRETAÇÃO ASSISTIDA POR IA</span><h2 id="analysis-ai-title">Insights inteligentes</h2><p>A interpretação organiza as métricas determinísticas e os dados públicos já exibidos neste relatório.</p></header>
    <p className="analysis-ai-notice">Este conteúdo foi gerado por inteligência artificial. As métricas determinísticas continuam sendo a fonte principal e não são substituídas por esta interpretação.</p>

    <article className="analysis-ai-subsection" id="insights-resumo"><span>RESUMO</span><h3>{analysis.summary.headline}</h3><p>{analysis.summary.overview}</p>{analysis.summary.primaryOpportunity && <p><strong>Principal oportunidade:</strong> {analysis.summary.primaryOpportunity}</p>}<small>{confidenceLabels[analysis.summary.confidence]}</small></article>

    <article className="analysis-ai-subsection" id="insights-bio"><span>ANÁLISE DA BIO</span><h3>Análise da bio</h3>{analysis.bioAnalysis.available ? <><p>{analysis.bioAnalysis.currentBioSummary}</p>{analysis.bioAnalysis.strengths.length > 0 && <div><h4>O que está funcionando</h4><ul>{analysis.bioAnalysis.strengths.map((item) => <li key={item}>{item}</li>)}</ul></div>}{analysis.bioAnalysis.weaknesses.length > 0 && <div><h4>Pontos a revisar</h4><ul>{analysis.bioAnalysis.weaknesses.map((item) => <li key={item}>{item}</li>)}</ul></div>}{analysis.bioAnalysis.recommendedImprovements.length > 0 && <div><h4>Melhorias recomendadas</h4><ul>{analysis.bioAnalysis.recommendedImprovements.map((item) => <li key={item}>{item}</li>)}</ul></div>}{analysis.bioAnalysis.suggestedBio && <><h4>Sugestão de bio</h4><blockquote>{analysis.bioAnalysis.suggestedBio}</blockquote></>}<small>{confidenceLabels[analysis.bioAnalysis.confidence]}</small></> : <p>A bio pública não contém dados suficientes para uma interpretação responsável.</p>}</article>

    <section className="analysis-ai-subsection" id="insights-pontos-fortes"><span>PONTOS FORTES</span><h3>Pontos fortes</h3>{strengths.length > 0 ? <div className="analysis-ai-card-grid">{strengths.map((item) => <article key={item.title}><h4>{item.title}</h4><p>{item.explanation}</p></article>)}</div> : <p>Não foram identificados pontos fortes com evidência suficiente nesta amostra.</p>}</section>

    <section className="analysis-ai-subsection" id="insights-oportunidades"><span>OPORTUNIDADES</span><h3>Oportunidades</h3>{opportunities.length > 0 ? <div className="analysis-ai-card-grid">{opportunities.map((item) => <article key={item.title}><span>{priorityLabels[item.priority]}</span><h4>{item.title}</h4><p>{item.explanation}</p><small>{confidenceLabels[item.confidence]}</small></article>)}</div> : <p>Nenhuma oportunidade atingiu a confiança mínima configurada.</p>}</section>

    <section className="analysis-ai-subsection" id="insights-proximas-acoes"><span>PRÓXIMAS AÇÕES</span><h3>Próximas ações</h3>{opportunities.length > 0 || planExplanations.length > 0 ? <div className="analysis-ai-actions">{opportunities.map((item, index) => <article key={`opportunity-${item.title}`}><b>{String(index + 1).padStart(2, "0")}</b><div><h4>{item.title}</h4><p>{item.suggestedAction}</p></div></article>)}{planExplanations.map((item, index) => <article key={`plan-${item.findingId}`}><b>{String(opportunities.length + index + 1).padStart(2, "0")}</b><div><h4>Leitura do plano determinístico</h4><p>{item.explanation}</p></div></article>)}</div> : <p>O plano determinístico permanece disponível abaixo; a IA não acrescentou ações com confiança suficiente.</p>}</section>

    <section className="analysis-ai-subsection" id="insights-ideias"><span>IDEIAS DE CONTEÚDO</span><h3>Ideias de conteúdo</h3>{ideas.length > 0 ? <div className="analysis-ai-card-grid">{ideas.map((idea) => <article key={idea.title}><span>{formatLabels[idea.format]}</span><h4>{idea.title}</h4><p><strong>Objetivo:</strong> {idea.objective}</p><p>{idea.concept}</p>{idea.suggestedHook && <p><strong>Gancho:</strong> {idea.suggestedHook}</p>}{idea.suggestedCTA && <p><strong>CTA:</strong> {idea.suggestedCTA}</p>}</article>)}</div> : <p>Não há ideias com evidência suficiente para esta amostra.</p>}</section>

    <section className="analysis-ai-subsection analysis-ai-limitations" id="insights-limitacoes"><span>LIMITAÇÕES</span><h3>Limitações</h3><ul>{analysis.limitations.map((item) => <li key={item}>{item}</li>)}</ul></section>
    {hasPreviewLimit && <p className="analysis-ai-preview">Esta é uma prévia. Parte dos insights permanece oculta pela configuração pública atual.</p>}
  </section>;
}
