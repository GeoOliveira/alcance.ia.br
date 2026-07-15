import type { ActionPlanItem } from "@/lib/analysis/metrics";
import { AnalysisSectionTracker } from "./analysis-section-tracker";

const priorityLabels = { high: "Prioridade alta", medium: "Prioridade média", low: "Prioridade baixa" };
const confidenceLabels = { high: "Confiança alta", medium: "Confiança média", low: "Confiança baixa", unavailable: "Confiança indisponível" };

export function AnalysisActionPlan({ items, requestId }: { items: ActionPlanItem[]; requestId: string }) {
  if (!items.length) return null;
  return <section className="analysis-section analysis-action-plan" id="plano"><AnalysisSectionTracker requestId={requestId} sectionId="action_plan" actionPlan /><div className="analysis-section-heading"><span>11</span><div><span className="analysis-heading-kicker">PRÓXIMOS PASSOS</span><h2>Plano de ação determinístico</h2><p>Recomendações vinculadas apenas às evidências disponíveis nesta coleta.</p></div></div><div className="analysis-action-list">{items.map((item, index) => <article key={item.id} data-priority={item.priority}><header><span>{String(index + 1).padStart(2, "0")}</span><div><small>{priorityLabels[item.priority]}</small><h3>{item.title}</h3></div></header><p>{item.description}</p><dl><div><dt>Evidência</dt><dd>{item.evidence}</dd></div><div><dt>Ação sugerida</dt><dd>{item.suggestedAction}</dd></div></dl><footer><span>{confidenceLabels[item.confidence.level]}</span><span>Amostra: {item.confidence.sampleSize}</span><span title={item.sourceMetrics.join(", ")}>Origem: {item.sourceMetrics.join(", ")}</span></footer></article>)}</div><p className="analysis-plan-disclaimer">Este plano prioriza poucas ações e não prevê resultados futuros. Recalcule após acumular uma nova amostra comparável.</p></section>;
}
