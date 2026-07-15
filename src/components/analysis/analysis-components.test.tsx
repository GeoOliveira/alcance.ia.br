import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { AnalysisMetrics, AnalysisViewModel } from "@/lib/analysis/types";
import { AnalysisErrorState } from "./analysis-error-state";
import { AnalysisMetricsGrid } from "./analysis-metrics-grid";
import { AnalysisMethodology } from "./analysis-methodology";
import { AnalysisSectionNav } from "./analysis-section-nav";
import { AnalysisTopPosts } from "./analysis-top-posts";
import { AnalysisActionPlan } from "./analysis-action-plan";
import { AnalysisHeroSummary } from "./analysis-hero-summary";
import { AnalysisAIInterpretation } from "./analysis-ai-interpretation";
import type { AIProfileAnalysisOutput } from "@/lib/ai/contracts/ai-analysis-output";

const metrics: AnalysisMetrics = { averageLikes: null, averageComments: null, medianLikes: null, medianComments: null, averageInteractions: null, medianInteractions: null, estimatedEngagementRate: null, estimatedTypicalEngagementRate: null, averageReelViews: null, analyzedPosts: 1, validEngagementPosts: 0, reelsCount: 0, imagesCount: 1, carouselsCount: 0, postsLast7Days: 0, postsLast30Days: 1, averageIntervalDays: null, followersFollowingRatio: null, mostUsedFormat: "Imagens", bestObservedFormat: "Imagens", engagementLabel: "Dados insuficientes", engagementConfidence: "insufficient", consistencyLabel: "Dados insuficientes", contentLabel: "Dados insuficientes", engagementFormulaVersion: "engagement-v2", engagementCalculatedAt: "2026-07-14T12:00:00Z", followersCountUsed: null, engagementMaxPosts: 20, engagementMaxAgeDays: 90, engagementExclusions: { missing_date: 0, outside_time_window: 0, over_post_limit: 0, missing_likes: 1, missing_comments: 1 }, minimumInteractions: null, maximumInteractions: null, meanMedianRatio: null, topPostShare: null, topThreeShare: null };

const partialAnalysis: AnalysisViewModel = {
  requestId: "request",
  state: "partial",
  stage: "complete",
  username: "perfil",
  profileUrl: "https://www.instagram.com/perfil",
  requestedAt: "2026-07-14T12:00:00Z",
  analyzedAt: "2026-07-14T12:00:00Z",
  profile: null,
  posts: [],
  metrics,
  observations: [],
  topPosts: [],
  isCached: false,
  statusMessage: "Parte dos dados não estava disponível; as métricas exibidas usam a amostra obtida.",
};

const aiAnalysis: AIProfileAnalysisOutput = {
  schemaVersion: "ai-profile-analysis-v1",
  summary: { headline: "Leitura estratégica da amostra", overview: "Resumo fundamentado nas métricas disponíveis.", primaryOpportunity: "Melhorar a clareza da proposta.", confidence: "medium" },
  bioAnalysis: { available: true, currentBioSummary: "A bio apresenta o tema do perfil.", strengths: ["Tema identificável"], weaknesses: ["Proposta pouco específica"], recommendedImprovements: ["Explicitar o público"], suggestedBio: "Conteúdo para marcas que querem crescer.", confidence: "medium" },
  strengths: [{ title: "Consistência observada", explanation: "A frequência se manteve estável na amostra.", evidenceMetricIds: ["publishing.regularity"] }],
  opportunities: [{ priority: "high", title: "Clarificar a proposta", explanation: "A bio pode ser mais específica.", suggestedAction: "Reescrever a primeira linha da bio.", evidenceMetricIds: ["profile.completeness"], confidence: "medium" }],
  contentIdeas: [{ title: "Bastidores do processo", format: "reel", objective: "Gerar proximidade", concept: "Mostrar as etapas de criação.", suggestedHook: "Como começamos um projeto", suggestedCTA: "Salve para consultar depois", evidenceMetricIds: ["content.best_format"] }],
  actionPlanExplanation: [{ findingId: "bio", explanation: "Comece pela bio porque ela contextualiza as publicações.", evidenceMetricIds: ["profile.completeness"] }],
  limitations: ["A leitura considera somente dados públicos da amostra."],
};

describe("analysis components", () => {
  it("renders private profile state without technical details", () => { const html = renderToStaticMarkup(<AnalysisErrorState state="private" />); expect(html).toContain("PERFIL PRIVADO"); expect(html).toContain("Tentar outro perfil"); expect(html).not.toContain("stack"); });
  it("renders not found state", () => expect(renderToStaticMarkup(<AnalysisErrorState state="not_found" />)).toContain("Não localizamos"));
  it("renders temporary error state", () => expect(renderToStaticMarkup(<AnalysisErrorState state="temporary_error" />)).toContain("Tente novamente"));
  it("renders unavailable metrics as text, not zero", () => { const html = renderToStaticMarkup(<AnalysisMetricsGrid metrics={metrics} />); expect(html).toContain("Não disponível"); expect(html).toContain("Dados insuficientes"); });
  it("renders an accessible report navigation", () => { const html = renderToStaticMarkup(<AnalysisSectionNav />); expect(html).toContain('aria-label="Seções desta análise"'); expect(html).toContain('href="#publicacoes"'); });
  it("does not link to optional sections that are absent", () => { const html = renderToStaticMarkup(<AnalysisSectionNav showCompleteness={false} showTrend={false} showStructure={false} showPlan={false} />); expect(html).not.toContain('href="#tendencia"'); expect(html).not.toContain('href="#estrutura"'); expect(html).not.toContain('href="#plano"'); });
  it("renders every requested intelligent insight subsection", () => { const html = renderToStaticMarkup(<AnalysisAIInterpretation analysis={aiAnalysis} visibility="full" />); for (const label of ["Insights inteligentes", "RESUMO", "ANÁLISE DA BIO", "PONTOS FORTES", "OPORTUNIDADES", "PRÓXIMAS AÇÕES", "IDEIAS DE CONTEÚDO", "LIMITAÇÕES"]) expect(html).toContain(label); });
  it("isolates intelligent insight cards from the legacy feature grid", () => { const html = renderToStaticMarkup(<AnalysisAIInterpretation analysis={aiAnalysis} visibility="full" />); const css = readFileSync(new URL("../../app/analisar/analysis.css", import.meta.url), "utf8"); expect(html.match(/analysis-ai-card-grid/g)).toHaveLength(3); expect(css).toContain(".analysis-ai-card-grid article { display: flex;"); });
  it("renders methodology with the real sample size", () => { const html = renderToStaticMarkup(<AnalysisMethodology postsCount={1} metrics={metrics} requestId="request" />); expect(html).toContain("Como calculamos o engajamento"); expect(html).toContain("1 publicação"); });
  it("keeps the partial-data methodology visible in an information note", () => { const html = renderToStaticMarkup(<AnalysisHeroSummary analysis={partialAnalysis} />); expect(html).toContain('role="note"'); expect(html).toContain("Parte dos dados não estava disponível; as métricas exibidas usam a amostra obtida."); expect(html).toContain("A taxa usa 0 publicações válidas e tem confiança insuficiente."); });
  it("renders a useful empty state when no top posts exist", () => { const html = renderToStaticMarkup(<AnalysisTopPosts posts={[]} requestId="request" />); expect(html).toContain("Ainda não há publicações suficientes"); expect(html).toContain("Tentar novamente no futuro"); });
  it("renders an evidence-backed deterministic action", () => { const html = renderToStaticMarkup(<AnalysisActionPlan requestId="request" items={[{ id: "cta", priority: "medium", category: "cta", title: "Teste chamadas", description: "Poucos conteúdos orientam uma ação.", evidence: "10% com CTA.", suggestedAction: "Teste chamadas específicas.", confidence: { level: "medium", sampleSize: 10, reason: "Amostra suficiente." }, sourceMetrics: ["ctaAnalysis.percentageWithCta"] }]} />); expect(html).toContain("10% com CTA"); expect(html).toContain("ctaAnalysis.percentageWithCta"); });
  it("enforces the analysis typography floor and narrow-screen metric layout", () => { const css = readFileSync(new URL("../../app/analisar/analysis.css", import.meta.url), "utf8"); expect(css).not.toMatch(/font(?:-size)?:\s*(?:[0-9]|1[01])px/); expect(css).toContain("--analysis-muted: #58665d"); expect(css).toMatch(/@media \(max-width: 430px\)[\s\S]*?\.analysis-metric-grid \{ grid-template-columns: 1fr; \}/); });
});
