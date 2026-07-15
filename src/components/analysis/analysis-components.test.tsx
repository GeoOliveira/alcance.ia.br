import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { AnalysisMetrics } from "@/lib/analysis/types";
import { AnalysisErrorState } from "./analysis-error-state";
import { AnalysisMetricsGrid } from "./analysis-metrics-grid";
import { AnalysisMethodology } from "./analysis-methodology";
import { AnalysisSectionNav } from "./analysis-section-nav";
import { AnalysisTopPosts } from "./analysis-top-posts";
import { AnalysisActionPlan } from "./analysis-action-plan";

const metrics: AnalysisMetrics = { averageLikes: null, averageComments: null, medianLikes: null, medianComments: null, averageInteractions: null, medianInteractions: null, estimatedEngagementRate: null, estimatedTypicalEngagementRate: null, averageReelViews: null, analyzedPosts: 1, validEngagementPosts: 0, reelsCount: 0, imagesCount: 1, carouselsCount: 0, postsLast7Days: 0, postsLast30Days: 1, averageIntervalDays: null, followersFollowingRatio: null, mostUsedFormat: "Imagens", bestObservedFormat: "Imagens", engagementLabel: "Dados insuficientes", engagementConfidence: "insufficient", consistencyLabel: "Dados insuficientes", contentLabel: "Dados insuficientes", engagementFormulaVersion: "engagement-v2", engagementCalculatedAt: "2026-07-14T12:00:00Z", followersCountUsed: null, engagementMaxPosts: 20, engagementMaxAgeDays: 90, engagementExclusions: { missing_date: 0, outside_time_window: 0, over_post_limit: 0, missing_likes: 1, missing_comments: 1 }, minimumInteractions: null, maximumInteractions: null, meanMedianRatio: null, topPostShare: null, topThreeShare: null };

describe("analysis components", () => {
  it("renders private profile state without technical details", () => { const html = renderToStaticMarkup(<AnalysisErrorState state="private" />); expect(html).toContain("PERFIL PRIVADO"); expect(html).toContain("Tentar outro perfil"); expect(html).not.toContain("stack"); });
  it("renders not found state", () => expect(renderToStaticMarkup(<AnalysisErrorState state="not_found" />)).toContain("Não localizamos"));
  it("renders temporary error state", () => expect(renderToStaticMarkup(<AnalysisErrorState state="temporary_error" />)).toContain("Tente novamente"));
  it("renders unavailable metrics as text, not zero", () => { const html = renderToStaticMarkup(<AnalysisMetricsGrid metrics={metrics} />); expect(html).toContain("Não disponível"); expect(html).toContain("Dados insuficientes"); });
  it("renders an accessible report navigation", () => { const html = renderToStaticMarkup(<AnalysisSectionNav />); expect(html).toContain('aria-label="Seções desta análise"'); expect(html).toContain('href="#publicacoes"'); });
  it("renders methodology with the real sample size", () => { const html = renderToStaticMarkup(<AnalysisMethodology postsCount={1} metrics={metrics} requestId="request" />); expect(html).toContain("Como calculamos o engajamento"); expect(html).toContain("1 publicação"); });
  it("renders a useful empty state when no top posts exist", () => { const html = renderToStaticMarkup(<AnalysisTopPosts posts={[]} requestId="request" />); expect(html).toContain("Ainda não há publicações suficientes"); expect(html).toContain("Tentar novamente no futuro"); });
  it("renders an evidence-backed deterministic action", () => { const html = renderToStaticMarkup(<AnalysisActionPlan requestId="request" items={[{ id: "cta", priority: "medium", category: "cta", title: "Teste chamadas", description: "Poucos conteúdos orientam uma ação.", evidence: "10% com CTA.", suggestedAction: "Teste chamadas específicas.", confidence: { level: "medium", sampleSize: 10, reason: "Amostra suficiente." }, sourceMetrics: ["ctaAnalysis.percentageWithCta"] }]} />); expect(html).toContain("10% com CTA"); expect(html).toContain("ctaAnalysis.percentageWithCta"); });
});
