import { formatDecimal, formatPercentage } from "@/lib/analysis/analysis-formatters";
import type { AnalysisMetrics } from "@/lib/analysis/types";
import type { ContentDiversityResult, FormatPerformanceResult } from "@/lib/analysis/metrics";
import { AnalysisSectionTracker } from "./analysis-section-tracker";

const labels = { reel: "Reels", image: "Imagens", carousel: "Carrosséis", unknown: "Outros" } as const;

export function AnalysisContentFormatBreakdown({ metrics, diversity, performance, requestId }: { metrics: AnalysisMetrics; diversity?: ContentDiversityResult; performance?: FormatPerformanceResult[]; requestId: string }) {
  const legacyCounts = { reel: metrics.reelsCount, image: metrics.imagesCount, carousel: metrics.carouselsCount, unknown: 0 };
  const counts = diversity?.counts ?? legacyCounts;
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const formats = (["reel", "image", "carousel"] as const).map((format) => ({ format, label: labels[format], count: counts[format], percentage: diversity?.percentages[format] ?? null, result: performance?.find((item) => item.format === format) }));

  return <section className="analysis-section" id="formatos"><AnalysisSectionTracker requestId={requestId} sectionId="content_formats" /><div className="analysis-section-heading"><span>08</span><div><h2>Formatos de conteúdo</h2><p>{metrics.contentLabel} · formato mais usado: {metrics.mostUsedFormat || "não disponível"}.</p></div></div>{total > 0 ? <><div className="analysis-format-composition" role="img" aria-label={formats.map((item) => `${item.label}: ${item.count}`).join(", ")}>{formats.map((item, index) => item.count > 0 && <i key={item.format} data-format={index} style={{ width: `${item.percentage ?? 0}%` }} />)}</div><div className="analysis-format-grid">{formats.map((item, index) => <article key={item.format} data-format={index}><div><span>{item.label}</span><strong>{item.count}</strong></div><i><em style={{ width: `${item.percentage ?? 0}%` }} /></i><small>{item.percentage === null ? "Percentual indisponível nesta versão" : `${formatDecimal(item.percentage, 1)}% da amostra`}</small>{item.result?.available ? <dl><div><dt>Engajamento médio</dt><dd>{formatPercentage(item.result.averageEngagementRate)}</dd></div><div><dt>Mediana de curtidas</dt><dd>{formatDecimal(item.result.medianLikes, 0)}</dd></div></dl> : <p>Amostra insuficiente para comparar desempenho.</p>}</article>)}</div></> : <div className="analysis-empty-state"><span aria-hidden="true">□</span><div><h3>Dados de formato ainda insuficientes</h3><p>Não existem publicações públicas suficientes para comparar Reels, imagens e carrosséis.</p></div></div>}</section>;
}
