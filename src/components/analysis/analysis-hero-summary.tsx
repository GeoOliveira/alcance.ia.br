import { formatPercentage } from "@/lib/analysis/analysis-formatters";
import type { AnalysisViewModel } from "@/lib/analysis/types";
import { AnalysisIcon } from "./analysis-icon";

const engagementLevels = ["Baixo", "Moderado", "Bom", "Alto"];

export function AnalysisHeroSummary({ analysis }: { analysis: AnalysisViewModel }) {
  const metrics = analysis.metrics!;
  const activeLevel = engagementLevels.findIndex((item) => item === metrics.engagementLabel);
  const opportunity = metrics.consistencyLabel === "Irregular" ? "Criar uma frequência mais previsível" : metrics.bestObservedFormat ? `Explorar o potencial de ${metrics.bestObservedFormat}` : "Ampliar a amostra de conteúdos";

  return <section className="analysis-summary" id="resumo">
    <div className="analysis-summary-main">
      <span className="eyebrow">RESUMO EXECUTIVO</span>
      <div className="analysis-primary-metric"><span>Engajamento médio estimado</span><strong>{formatPercentage(metrics.estimatedEngagementRate)}</strong></div>
      <div className="analysis-status-scale" aria-label={`Classificação de engajamento: ${metrics.engagementLabel}`}><div aria-hidden="true">{engagementLevels.map((level, index) => <i className={index <= activeLevel ? "active" : ""} key={level} />)}</div><span>{metrics.engagementLabel}</span></div>
      <p>{analysis.statusMessage} A taxa usa {metrics.validEngagementPosts} publicações válidas e tem confiança {metrics.engagementConfidence === "high" ? "alta" : metrics.engagementConfidence === "medium" ? "média" : metrics.engagementConfidence === "low" ? "baixa" : "insuficiente"}.</p>
    </div>
    <div className="analysis-summary-support">
      <article><span className="analysis-summary-icon"><AnalysisIcon name="calendar" /></span><div><small>Consistência</small><strong>{metrics.consistencyLabel}</strong><p>{metrics.postsLast30Days} posts nos últimos 30 dias</p></div></article>
      <article><span className="analysis-summary-icon"><AnalysisIcon name="image" /></span><div><small>Formato mais forte</small><strong>{metrics.bestObservedFormat || "Dados insuficientes"}</strong><p>Melhor média de interações observada</p></div></article>
      <article className="analysis-opportunity"><span className="analysis-summary-icon"><AnalysisIcon name="spark" /></span><div><small>Principal oportunidade</small><strong>{opportunity}</strong><p>Orientação baseada nos sinais desta amostra.</p></div></article>
    </div>
  </section>;
}
