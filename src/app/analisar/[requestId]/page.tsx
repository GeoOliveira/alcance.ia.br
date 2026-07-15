import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { EventTracker } from "@/components/analytics/event-tracker";
import { AnalysisLoadingState } from "@/components/analysis/analysis-loading-state";
import { AnalysisErrorState } from "@/components/analysis/analysis-error-state";
import { AnalysisHeader } from "@/components/analysis/analysis-header";
import { AnalysisHeroSummary } from "@/components/analysis/analysis-hero-summary";
import { AnalysisProfileOverview } from "@/components/analysis/analysis-profile-overview";
import { AnalysisMetricsGrid } from "@/components/analysis/analysis-metrics-grid";
import { AnalysisConsistencyCard } from "@/components/analysis/analysis-consistency-card";
import { AnalysisContentFormatBreakdown } from "@/components/analysis/analysis-content-format-breakdown";
import { AnalysisTopPosts } from "@/components/analysis/analysis-top-posts";
import { AnalysisInsightsCard } from "@/components/analysis/analysis-insights-card";
import { AnalysisUpgradeCta } from "@/components/analysis/analysis-upgrade-cta";
import { AnalysisSectionNav } from "@/components/analysis/analysis-section-nav";
import { AnalysisMethodology } from "@/components/analysis/analysis-methodology";
import { getAnalysisById } from "@/lib/analysis/get-analysis-by-id";

const cookieName = "alcance_anonymous_session";
async function readAnalysis(requestId: string) { const store = await cookies(); return getAnalysisById(requestId, store.get(cookieName)?.value); }
export async function generateMetadata({ params }: { params: Promise<{ requestId: string }> }): Promise<Metadata> { const { requestId } = await params; const analysis = await readAnalysis(requestId); return { title: analysis ? `Análise de @${analysis.username}` : "Análise de perfil", description: "Resultado individual de análise de dados públicos do Instagram.", robots: { index: false, follow: false, nocache: true } }; }
export default async function Page({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params; const analysis = await readAnalysis(requestId); if (!analysis) notFound();
  if (analysis.state === "waiting" || analysis.state === "processing") return <main className="analysis-page analysis-processing-page"><Container><AnalysisLoadingState requestId={requestId} initialStage={analysis.stage} /></Container></main>;
  if (["not_found", "private", "temporary_error", "unavailable"].includes(analysis.state)) return <main className="analysis-page analysis-processing-page"><EventTracker name="analysis_error_viewed" properties={{ request_id: requestId, error_code: analysis.state }} /><Container><AnalysisErrorState state={analysis.state as "not_found" | "private" | "temporary_error" | "unavailable"} /></Container></main>;
  if (!analysis.profile || !analysis.metrics) return <main className="analysis-page analysis-processing-page"><Container><AnalysisErrorState state="temporary_error" /></Container></main>;
  return <main className="analysis-page"><EventTracker name="analysis_viewed" properties={{ request_id: requestId }} /><EventTracker name="analysis_completed" properties={{ request_id: requestId }} />
    <Container><AnalysisHeader analysis={analysis} />{(analysis.state === "partial" || analysis.state === "insufficient_data") && <div className="analysis-quality-banner" role="status"><strong>{analysis.state === "partial" ? "Resultado parcialmente concluído" : "Poucos dados disponíveis"}</strong><span>{analysis.statusMessage}</span></div>}<AnalysisHeroSummary analysis={analysis} /><AnalysisSectionNav /><AnalysisInsightsCard observations={analysis.observations} /><AnalysisProfileOverview analysis={analysis} /><AnalysisMetricsGrid metrics={analysis.metrics} /><AnalysisConsistencyCard analysis={analysis} /><AnalysisContentFormatBreakdown metrics={analysis.metrics} /><AnalysisTopPosts posts={analysis.topPosts} requestId={requestId} /><AnalysisMethodology postsCount={analysis.posts.length} /></Container><AnalysisUpgradeCta requestId={requestId} />
  </main>;
}
