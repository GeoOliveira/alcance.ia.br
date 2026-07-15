import { formatDecimal, formatPercentage } from "@/lib/analysis/analysis-formatters";
import type { AnalysisViewModel } from "@/lib/analysis/types";
import type { PublishingRegularityResult } from "@/lib/analysis/metrics";
import { AnalysisIcon } from "./analysis-icon";
import { AnalysisSectionTracker } from "./analysis-section-tracker";

const labels = { consistent: "Consistente", moderately_consistent: "Moderadamente consistente", irregular: "Irregular", recently_inactive: "Inativo recentemente", insufficient: "Dados insuficientes" };

export function AnalysisConsistencyCard({ analysis, regularity, requestId }: { analysis: AnalysisViewModel; regularity?: PublishingRegularityResult; requestId: string }) {
  const basic = analysis.metrics!;
  const posts7 = regularity?.postsLast7Days ?? basic.postsLast7Days;
  const posts30 = regularity?.postsLast30Days ?? basic.postsLast30Days;
  return <section className="analysis-section analysis-split" id="consistencia"><AnalysisSectionTracker requestId={requestId} sectionId="publishing_regularity" /><div><div className="analysis-section-heading"><span>07</span><div><h2>Consistência de publicação</h2><p>Ritmo recente calculado pelas datas públicas disponíveis.</p></div></div><div className="analysis-consistency-status"><span className="analysis-summary-icon"><AnalysisIcon name="calendar" /></span><div><strong>{regularity ? labels[regularity.classification] : basic.consistencyLabel}</strong><span>{(regularity?.averageIntervalDays ?? basic.averageIntervalDays) === null ? "Intervalo indisponível" : `Intervalo médio de ${formatDecimal(regularity?.averageIntervalDays ?? basic.averageIntervalDays)} dias`}</span></div></div></div><div className="analysis-bars" role="group" aria-label="Regularidade de publicação"><div className="analysis-period-comparison"><span><b>{posts7}</b><small>7 dias</small></span><i /><span><b>{posts30}</b><small>30 dias</small></span></div>{regularity ? <dl className="analysis-regularity-facts"><div><dt>Participação dos últimos 7 dias</dt><dd>{formatPercentage(regularity.last7ShareOf30Percent)}</dd></div><div><dt>Média semanal</dt><dd>{formatDecimal(regularity.weeklyAverage, 1)}</dd></div><div><dt>Maior intervalo</dt><dd>{regularity.longestGapDays === null ? "—" : `${formatDecimal(regularity.longestGapDays, 1)} dias`}</dd></div><div><dt>Semanas ativas / inativas</dt><dd>{regularity.activeWeeks} / {regularity.inactiveWeeks}</dd></div></dl> : <p>As métricas avançadas de regularidade não estavam habilitadas nesta análise.</p>}</div></section>;
}
