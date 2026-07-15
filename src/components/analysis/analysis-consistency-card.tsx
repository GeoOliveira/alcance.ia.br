import { formatDecimal } from "@/lib/analysis/analysis-formatters";
import type { AnalysisViewModel } from "@/lib/analysis/types";
import { AnalysisIcon } from "./analysis-icon";

export function AnalysisConsistencyCard({ analysis }: { analysis: AnalysisViewModel }) {
  const m = analysis.metrics!, max = Math.max(m.postsLast30Days, 1);

  return <section className="analysis-section analysis-split" id="consistencia"><div><div className="analysis-section-heading"><span>04</span><div><h2>Consistência de publicação</h2><p>Ritmo recente calculado pelas datas públicas disponíveis.</p></div></div><div className="analysis-consistency-status"><span className="analysis-summary-icon"><AnalysisIcon name="calendar" /></span><div><strong>{m.consistencyLabel}</strong><span>{m.averageIntervalDays === null ? "Intervalo indisponível" : `Intervalo médio de ${formatDecimal(m.averageIntervalDays)} dias`}</span></div></div></div><div className="analysis-bars" role="img" aria-label={`${m.postsLast7Days} publicações nos últimos 7 dias e ${m.postsLast30Days} nos últimos 30 dias.`}><div className="analysis-period-comparison" aria-hidden="true"><span><b>{m.postsLast7Days}</b><small>7 dias</small></span><i /><span><b>{m.postsLast30Days}</b><small>30 dias</small></span></div><div><span>Últimos 7 dias <b>{m.postsLast7Days}</b></span><i><em style={{ width: `${Math.min(100, m.postsLast7Days / max * 100)}%` }} /></i></div><div><span>Últimos 30 dias <b>{m.postsLast30Days}</b></span><i><em style={{ width: "100%" }} /></i></div><p>{m.postsLast30Days >= 12 ? "O perfil apresentou atividade frequente no período." : m.postsLast30Days >= 4 ? "O perfil apresentou atividade recorrente no período." : "A atividade recente observada foi baixa."}</p></div></section>;
}
