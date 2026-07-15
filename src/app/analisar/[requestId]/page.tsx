import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { after } from "next/server";
import { Container } from "@/components/ui/container";
import { EventTracker } from "@/components/analytics/event-tracker";
import { AnalysisActionPlan } from "@/components/analysis/analysis-action-plan";
import { AnalysisConsistencyCard } from "@/components/analysis/analysis-consistency-card";
import { AnalysisContentFormatBreakdown } from "@/components/analysis/analysis-content-format-breakdown";
import { AnalysisEngagementDiagnostics } from "@/components/analysis/analysis-engagement-diagnostics";
import { AnalysisErrorState } from "@/components/analysis/analysis-error-state";
import { AnalysisHeader } from "@/components/analysis/analysis-header";
import { AnalysisHeroSummary } from "@/components/analysis/analysis-hero-summary";
import { AnalysisInsightsCard } from "@/components/analysis/analysis-insights-card";
import { AnalysisLoadingState } from "@/components/analysis/analysis-loading-state";
import { AnalysisMethodology } from "@/components/analysis/analysis-methodology";
import { AnalysisMetricsGrid } from "@/components/analysis/analysis-metrics-grid";
import { AnalysisProfileCompleteness } from "@/components/analysis/analysis-profile-completeness";
import { AnalysisProfileOverview } from "@/components/analysis/analysis-profile-overview";
import { AnalysisPublicationStructure } from "@/components/analysis/analysis-publication-structure";
import { AnalysisRecentTrend } from "@/components/analysis/analysis-recent-trend";
import { AnalysisSectionNav } from "@/components/analysis/analysis-section-nav";
import { AnalysisTopPosts } from "@/components/analysis/analysis-top-posts";
import { AnalysisUpgradeCta } from "@/components/analysis/analysis-upgrade-cta";
import { AnalysisAIState } from "@/components/analysis/analysis-ai-state";
import { AnalysisProductInsights } from "@/components/analysis/analysis-product-insights";
import { AnalysisExecutiveDashboard } from "@/components/analysis/dashboard/analysis-executive-dashboard";
import { generateAIAnalysisForRequest } from "@/lib/ai";
import { getAnalysisById } from "@/lib/analysis/get-analysis-by-id";
import { buildDashboardData } from "@/lib/analysis/dashboard/data";

const cookieName = "alcance_anonymous_session";
async function readAnalysis(requestId: string) {
  const store = await cookies();
  return getAnalysisById(requestId, store.get(cookieName)?.value);
}

export async function generateMetadata({ params }: { params: Promise<{ requestId: string }> }): Promise<Metadata> {
  const { requestId } = await params;
  const analysis = await readAnalysis(requestId);
  return { title: analysis ? `Análise de @${analysis.username}` : "Análise de perfil", description: "Resultado individual de análise de dados públicos do Instagram.", robots: { index: false, follow: false, nocache: true } };
}

export default async function Page({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const analysis = await readAnalysis(requestId);
  if (!analysis) notFound();
  if (analysis.state === "waiting" || analysis.state === "processing") return <main className="analysis-page analysis-processing-page"><Container><AnalysisLoadingState requestId={requestId} initialStage={analysis.stage} /></Container></main>;
  if (["not_found", "private", "temporary_error", "unavailable"].includes(analysis.state)) return <main className="analysis-page analysis-processing-page"><EventTracker name="analysis_error_viewed" properties={{ request_id: requestId, error_code: analysis.state }} /><Container><AnalysisErrorState state={analysis.state as "not_found" | "private" | "temporary_error" | "unavailable"} /></Container></main>;
  if (!analysis.profile || !analysis.metrics) return <main className="analysis-page analysis-processing-page"><Container><AnalysisErrorState state="temporary_error" /></Container></main>;

  const advanced = analysis.advancedMetrics;
  if (analysis.aiAnalysisState === "preparing") after(async () => { await generateAIAnalysisForRequest(requestId); });
  const hasStructure = Boolean(advanced?.captionAnalysis || advanced?.ctaAnalysis || advanced?.hashtagAnalysis || advanced?.highlightsAudit);
  return <main className="analysis-page">
    <EventTracker name="analysis_viewed" properties={{ request_id: requestId }} />
    <EventTracker name="analysis_completed" properties={{ request_id: requestId }} />
    <Container>
      <AnalysisHeader analysis={analysis} />
      {(analysis.state === "partial" || analysis.state === "insufficient_data") && <div className="analysis-quality-banner" role="status"><strong>{analysis.state === "partial" ? "Resultado parcialmente concluído" : "Poucos dados disponíveis"}</strong><span>{analysis.statusMessage}</span></div>}
      <AnalysisSectionNav showAI={Boolean(analysis.aiAnalysisState)} showCompleteness={Boolean(advanced?.profileCompleteness)} showTrend={Boolean(advanced?.recentTrend)} showStructure={hasStructure} showPlan={Boolean(advanced?.actionPlan?.length)} />
      {analysis.dashboardModules && <AnalysisExecutiveDashboard modules={analysis.dashboardModules} data={buildDashboardData(analysis)} requestId={requestId} />}
      <AnalysisHeroSummary analysis={analysis} />
      <AnalysisProfileOverview analysis={analysis} />
      <AnalysisMetricsGrid metrics={analysis.metrics} />
      <AnalysisInsightsCard observations={analysis.observations} />
      {analysis.aiAnalysisState && <AnalysisAIState requestId={requestId} initialState={analysis.aiAnalysisState} analysis={analysis.aiAnalysis} visibility={analysis.aiAnalysisVisibility} />}
      {advanced && <AnalysisProfileCompleteness metrics={advanced} requestId={requestId} />}
      {advanced && <AnalysisEngagementDiagnostics metrics={advanced} requestId={requestId} />}
      {advanced?.recentTrend && <AnalysisRecentTrend trend={advanced.recentTrend} requestId={requestId} />}
      <AnalysisConsistencyCard analysis={analysis} regularity={advanced?.publishingRegularity} requestId={requestId} />
      <AnalysisContentFormatBreakdown metrics={analysis.metrics} diversity={advanced?.contentDiversity} performance={advanced?.formatPerformance} requestId={requestId} />
      {advanced && <AnalysisPublicationStructure metrics={advanced} requestId={requestId} />}
      {analysis.productInsights && <AnalysisProductInsights insights={analysis.productInsights} requestId={requestId} />}
      <AnalysisTopPosts posts={analysis.topPosts} requestId={requestId} />
      {advanced?.actionPlan && <AnalysisActionPlan items={advanced.actionPlan} requestId={requestId} />}
      <AnalysisMethodology postsCount={analysis.posts.length} metrics={analysis.metrics} methodology={advanced?.methodology} advanced={advanced} requestId={requestId} />
    </Container>
    {!analysis.aiAnalysisState && <AnalysisUpgradeCta requestId={requestId} />}
  </main>;
}
