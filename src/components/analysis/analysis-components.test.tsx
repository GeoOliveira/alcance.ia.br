import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AnalysisErrorState } from "./analysis-error-state";
import { AnalysisMetricsGrid } from "./analysis-metrics-grid";
import { AnalysisMethodology } from "./analysis-methodology";
import { AnalysisSectionNav } from "./analysis-section-nav";
import { AnalysisTopPosts } from "./analysis-top-posts";
import type { AnalysisMetrics } from "@/lib/analysis/types";
const metrics: AnalysisMetrics = { averageLikes: null, averageComments: null, medianLikes: null, medianComments: null, estimatedEngagementRate: null, averageReelViews: null, analyzedPosts: 1, reelsCount: 0, imagesCount: 1, carouselsCount: 0, postsLast7Days: 0, postsLast30Days: 1, averageIntervalDays: null, followersFollowingRatio: null, mostUsedFormat: "Imagens", bestObservedFormat: "Imagens", engagementLabel: "Dados insuficientes", consistencyLabel: "Dados insuficientes", contentLabel: "Dados insuficientes" };
describe("analysis components", () => {
  it("renders private profile state without technical details", () => { const html = renderToStaticMarkup(<AnalysisErrorState state="private" />); expect(html).toContain("PERFIL PRIVADO"); expect(html).toContain("Tentar outro perfil"); expect(html).not.toContain("stack"); });
  it("renders not found state", () => expect(renderToStaticMarkup(<AnalysisErrorState state="not_found" />)).toContain("Não localizamos"));
  it("renders temporary error state", () => expect(renderToStaticMarkup(<AnalysisErrorState state="temporary_error" />)).toContain("Tente novamente"));
  it("renders unavailable metrics as text, not zero", () => { const html = renderToStaticMarkup(<AnalysisMetricsGrid metrics={metrics} />); expect(html).toContain("Não disponível"); expect(html).toContain("Dados insuficientes"); });
  it("renders an accessible report navigation", () => { const html = renderToStaticMarkup(<AnalysisSectionNav />); expect(html).toContain('aria-label="Seções desta análise"'); expect(html).toContain('href="#publicacoes"'); });
  it("renders methodology with the real sample size", () => { const html = renderToStaticMarkup(<AnalysisMethodology postsCount={1} />); expect(html).toContain("Como calculamos estes dados"); expect(html).toContain("1 publicação analisada"); });
  it("renders a useful empty state when no top posts exist", () => { const html = renderToStaticMarkup(<AnalysisTopPosts posts={[]} requestId="request" />); expect(html).toContain("Ainda não há publicações suficientes"); expect(html).toContain("Tentar novamente no futuro"); });
});
