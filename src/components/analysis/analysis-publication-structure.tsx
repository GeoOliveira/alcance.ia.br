import { formatDecimal, formatPercentage } from "@/lib/analysis/analysis-formatters";
import type { AdvancedAnalysisMetrics } from "@/lib/analysis/metrics";
import { AnalysisSectionTracker } from "./analysis-section-tracker";

const lengthLabels = { short: "Curtas", medium: "Médias", long: "Longas", unavailable: "Indisponível" };

export function AnalysisPublicationStructure({ metrics, requestId }: { metrics: AdvancedAnalysisMetrics; requestId: string }) {
  const captions = metrics.captionAnalysis;
  const cta = metrics.ctaAnalysis;
  const hashtags = metrics.hashtagAnalysis;
  const highlights = metrics.highlightsAudit;
  if (!captions && !cta && !hashtags && !highlights) return null;

  return <section className="analysis-section" id="estrutura"><AnalysisSectionTracker requestId={requestId} sectionId="publication_structure" /><div className="analysis-section-heading"><span>09</span><div><h2>Estrutura das publicações</h2><p>Leitura descritiva de legendas, chamadas e hashtags — sem interpretar intenção ou qualidade criativa.</p></div></div><div className="analysis-structure-grid">{captions && <article><span>LEGENDAS</span><h3>{lengthLabels[captions.typicalLength]}</h3><dl><div><dt>Comprimento mediano</dt><dd>{captions.medianLength === null ? "—" : `${formatDecimal(captions.medianLength, 0)} caracteres`}</dd></div><div><dt>Com perguntas</dt><dd>{formatPercentage(captions.withQuestionsPercent)}</dd></div><div><dt>Com parágrafos</dt><dd>{formatPercentage(captions.withParagraphsPercent)}</dd></div><div><dt>Sem legenda</dt><dd>{captions.emptyCaptions}</dd></div></dl><small>{captions.confidence.sampleSize} publicações consideradas</small></article>}{cta && <article><span>CHAMADAS PARA AÇÃO</span><h3>{formatPercentage(cta.percentageWithCta)} com CTA</h3><p>A detecção usa expressões explícitas e conservadoras em português.</p><dl><div><dt>Com CTA</dt><dd>{cta.postsWithCta}</dd></div><div><dt>Sem CTA</dt><dd>{cta.postsWithoutCta}</dd></div><div><dt>Categorias encontradas</dt><dd>{cta.categories.length}</dd></div></dl></article>}{hashtags && <article><span>HASHTAGS</span><h3>{formatDecimal(hashtags.averagePerPost, 1)} por publicação</h3><dl><div><dt>Hashtags únicas</dt><dd>{hashtags.uniqueHashtags}</dd></div><div><dt>Repetidas</dt><dd>{hashtags.repeatedHashtags}</dd></div><div><dt>Sem hashtags</dt><dd>{hashtags.postsWithoutHashtags}</dd></div><div><dt>Concentração no topo</dt><dd>{formatPercentage(hashtags.topHashtagsConcentrationPercent)}</dd></div></dl></article>}{highlights && <article className="analysis-structure-unavailable"><span>DESTAQUES</span><h3>Auditoria indisponível</h3><p>Os destaques não fazem parte dos dados normalizados coletados. Nenhuma chamada adicional ao provedor foi feita.</p><small>Código: {highlights.explanationCode}</small></article>}</div></section>;
}
