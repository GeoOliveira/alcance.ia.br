import { formatCompactNumber, formatDecimal, formatPercentage } from "@/lib/analysis/analysis-formatters";
import type { AnalysisMetrics } from "@/lib/analysis/types";
import { AnalysisIcon } from "./analysis-icon";

export function AnalysisMetricsGrid({ metrics }: { metrics: AnalysisMetrics }) {
  const items = [
    { label: "Média de curtidas", value: formatCompactNumber(metrics.averageLikes), context: "por publicação com dado conhecido", icon: "heart" as const, featured: true },
    { label: "Média de comentários", value: formatDecimal(metrics.averageComments), context: "por publicação com dado conhecido", icon: "comment" as const },
    { label: "Média de views", value: formatCompactNumber(metrics.averageReelViews), context: "somente Reels com visualizações", icon: "eye" as const, featured: true },
    { label: "Engajamento estimado", value: formatPercentage(metrics.estimatedEngagementRate), context: metrics.engagementLabel, icon: "activity" as const },
    { label: "Mediana de curtidas", value: formatCompactNumber(metrics.medianLikes), context: "reduz o efeito de valores extremos", icon: "heart" as const },
    { label: "Mediana de comentários", value: formatDecimal(metrics.medianComments), context: "reduz o efeito de valores extremos", icon: "comment" as const },
    { label: "Conteúdos analisados", value: String(metrics.analyzedPosts), context: "itens públicos nesta amostra", icon: "posts" as const },
    { label: "Reels analisados", value: String(metrics.reelsCount), context: "vídeos identificados na amostra", icon: "image" as const },
  ];

  return <section className="analysis-section" id="engajamento"><div className="analysis-section-heading"><span>03</span><div><h2>Métricas em detalhe</h2><p>Números públicos organizados para facilitar comparação e leitura.</p></div></div><div className="analysis-metric-grid">{items.map((item) => <article className={item.featured ? "featured" : ""} key={item.label}><span className="analysis-metric-icon"><AnalysisIcon name={item.icon} /></span><div><span>{item.label}</span><strong>{item.value}</strong><small>{item.context}</small></div></article>)}</div><p className="analysis-method-note">Campos ausentes não são convertidos em zero. Por isso, algumas métricas podem aparecer como “Não disponível”.</p></section>;
}
