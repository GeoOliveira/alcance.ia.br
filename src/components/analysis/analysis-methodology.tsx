"use client";

import type { AdvancedAnalysisMetrics, AnalysisMethodologyV2, Confidence } from "@/lib/analysis/metrics";
import type { AnalysisMetrics } from "@/lib/analysis/types";
import { trackEvent } from "@/lib/analytics/track";
import { AnalysisIcon } from "./analysis-icon";

const confidenceLabels = { high: "alta", medium: "média", low: "baixa", unavailable: "indisponível" };

export function AnalysisMethodology({ postsCount, metrics, methodology, advanced, requestId }: { postsCount: number; metrics?: AnalysisMetrics; methodology?: AnalysisMethodologyV2; advanced?: AdvancedAnalysisMetrics; requestId: string }) {
  const onToggle = (event: React.SyntheticEvent<HTMLDetailsElement>) => {
    if (!event.currentTarget.open) return;
    trackEvent("analysis_methodology_opened", { request_id: requestId, section_id: "methodology", page_path: window.location.pathname }, { dedupeKey: `${requestId}:methodology`, dedupeWindowMs: 60_000 });
  };
  const confidenceCandidates: Array<[string, Confidence | undefined]> = advanced ? [
    ["Completude", advanced.profileCompleteness?.confidence],
    ["Formatos", advanced.contentDiversity?.confidence],
    ["Estabilidade", advanced.engagementStability?.confidence],
    ["Concentração", advanced.performanceConcentration?.confidence],
    ["Tendência", advanced.recentTrend?.confidence],
    ["Regularidade", advanced.publishingRegularity?.confidence],
    ["Legendas", advanced.captionAnalysis?.confidence],
    ["CTAs", advanced.ctaAnalysis?.confidence],
    ["Hashtags", advanced.hashtagAnalysis?.confidence],
    ["Destaques", advanced.highlightsAudit?.confidence],
  ] : [];
  const confidences = confidenceCandidates.filter((item): item is [string, Confidence] => Boolean(item[1]));

  return <section className="analysis-methodology" id="metodologia"><details onToggle={onToggle}><summary><span><AnalysisIcon name="info" /></span><div><strong>Como calculamos o engajamento</strong><small>Fonte, amostra, versão e limitações desta leitura</small></div><b aria-hidden="true">+</b></summary><div className="analysis-methodology-content"><p>A taxa é uma estimativa baseada nas curtidas e comentários públicos das publicações analisadas, divididos pelo número atual de seguidores. Os resultados podem diferir das métricas internas do Instagram.</p><p>O engajamento típico utiliza a mediana das interações para reduzir a influência de publicações muito acima ou abaixo do desempenho habitual.</p><p>A coleta encontrou <strong>{postsCount} {postsCount === 1 ? "publicação" : "publicações"}</strong>; {metrics ? `${metrics.validEngagementPosts} tinham data, curtidas e comentários válidos para a taxa.` : "a disponibilidade dos campos varia por publicação."}</p>{metrics && <dl className="analysis-methodology-facts"><div><dt>Fórmula</dt><dd>{metrics.engagementFormulaVersion}</dd></div><div><dt>Janela</dt><dd>Até {metrics.engagementMaxPosts} posts em {metrics.engagementMaxAgeDays || "—"} dias</dd></div><div><dt>Confiança</dt><dd>{metrics.engagementConfidence}</dd></div><div><dt>Seguidores usados</dt><dd>{metrics.followersCountUsed ?? "Indisponível"}</dd></div></dl>}{methodology && <dl className="analysis-methodology-facts"><div><dt>Versão dos módulos</dt><dd>{methodology.metricsVersion}</dd></div><div><dt>Janela observada</dt><dd>{methodology.observedWindow.days === null ? "Indisponível" : `${methodology.observedWindow.days} dias`}</dd></div><div><dt>Módulos ativos</dt><dd>{methodology.enabledModules.length}</dd></div><div><dt>Duração do cálculo</dt><dd>{methodology.calculationDurationMs} ms</dd></div></dl>}{confidences.length > 0 && <div className="analysis-confidence-list" aria-label="Confiança por módulo">{confidences.map(([label, confidence]) => <span key={label} title={confidence.reason}>{label}: {confidenceLabels[confidence.level]} · {confidence.sampleSize}</span>)}</div>}<ul><li>Zero observado é aceito; campo ausente exclui o post da taxa e não vira zero.</li><li>Comparações avançadas só aparecem quando atingem a amostra mínima configurada.</li><li>Posts fixados seguem a data real e a mesma janela temporal dos demais.</li><li>Visualizações de Reels não entram no engajamento por seguidores.</li><li>Destaques não são coletados e não geram chamadas extras.</li><li>Este relatório não substitui o Instagram Insights, que possui dados privados e históricos da conta.</li></ul>{methodology?.missingFields.length ? <p>Campos ausentes na coleta: {methodology.missingFields.join(", ")}.</p> : null}</div></details></section>;
}
