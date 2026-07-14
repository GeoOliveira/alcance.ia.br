import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AnalysisErrorState } from "./analysis-error-state";
import { AnalysisMetricsGrid } from "./analysis-metrics-grid";
import type { AnalysisMetrics } from "@/lib/analysis/types";
const metrics: AnalysisMetrics = { averageLikes: null, averageComments: null, medianLikes: null, medianComments: null, estimatedEngagementRate: null, averageReelViews: null, analyzedPosts: 1, reelsCount: 0, imagesCount: 1, carouselsCount: 0, postsLast7Days: 0, postsLast30Days: 1, averageIntervalDays: null, followersFollowingRatio: null, mostUsedFormat: "Imagens", bestObservedFormat: "Imagens", engagementLabel: "Dados insuficientes", consistencyLabel: "Dados insuficientes", contentLabel: "Dados insuficientes" };
describe("analysis components", () => {
  it("renders private profile state without technical details", () => { const html = renderToStaticMarkup(<AnalysisErrorState state="private" />); expect(html).toContain("PERFIL PRIVADO"); expect(html).toContain("Tentar outro perfil"); expect(html).not.toContain("stack"); });
  it("renders not found state", () => expect(renderToStaticMarkup(<AnalysisErrorState state="not_found" />)).toContain("Não localizamos"));
  it("renders temporary error state", () => expect(renderToStaticMarkup(<AnalysisErrorState state="temporary_error" />)).toContain("Tente novamente"));
  it("renders unavailable metrics as text, not zero", () => { const html = renderToStaticMarkup(<AnalysisMetricsGrid metrics={metrics} />); expect(html).toContain("Não disponível"); expect(html).toContain("Dados insuficientes"); });
});
