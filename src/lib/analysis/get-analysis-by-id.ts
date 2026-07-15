import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildAnalysisViewModel } from "./analysis-view-model";
import { developmentDemoAnalysis, developmentDemoId } from "./development-demo";
import { getAdvancedAnalysisRuntimeConfig } from "./advanced-config";
import { ANALYSIS_METRICS_VERSION, calculateAdvancedMetrics, enabledAdvancedMetricModules, persistedAdvancedMetricsSchema } from "./metrics";
import type { InstagramProfile } from "@/lib/social-providers/contracts/instagram-profile";
import type { InstagramPost } from "@/lib/social-providers/contracts/instagram-post";
import { getAIRuntimeConfig } from "@/lib/ai/runtime-config";
import { profileAnalysisOutputSchema } from "@/lib/ai/schemas/profile-analysis-schema";
import { filterAIOutputByFeatures } from "@/lib/ai/guards/feature-filter";
import { isOpenAIConfigured, isOpenAIEnvironmentEnabled } from "@/lib/ai/providers/openai/config";
import { getFeatureAccessMap } from "@/lib/product-features/access";
import { buildProfileProductInsights } from "@/lib/product-features/profile-insights";
import { getDashboardModules } from "./dashboard/access";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const getAnalysisById = cache(async (requestId: string, anonymousSessionId: string | undefined) => {
  if (process.env.NODE_ENV === "development" && process.env.ANALYSIS_DEV_DEMO === "true" && requestId === developmentDemoId) {
    const demo = developmentDemoAnalysis();
    const [access, dashboardModules] = await Promise.all([getFeatureAccessMap(), getDashboardModules({ hasAI: false })]);
    if (demo.profile) demo.productInsights = buildProfileProductInsights(demo.posts, demo.profile.followersCount, access);
    demo.dashboardModules = dashboardModules;
    return demo;
  }
  if (!uuid.test(requestId) || !anonymousSessionId || !uuid.test(anonymousSessionId)) return null;
  const admin = createAdminClient(); if (!admin) return null;
  const { data: request } = await admin.from("analysis_requests").select("id,instagram_username,instagram_profile_url,status,created_at,metadata,anonymous_session_id,user_id").eq("id", requestId).maybeSingle();
  if (!request || request.anonymous_session_id !== anonymousSessionId) return null;
  const { data: result } = await admin.from("analysis_results").select("id,data_quality,profile_data,posts_data,metrics,observations,fetched_at,source_metadata,metrics_version,engagement_formula_version,engagement_calculated_at,calculated_metrics,calculation_status").eq("request_id", requestId).maybeSingle();
  if (result?.profile_data && Array.isArray(result.posts_data)) {
    const runtime = await getAdvancedAnalysisRuntimeConfig();
    const persisted = persistedAdvancedMetricsSchema.safeParse(result.calculated_metrics);
    const expectedModules = enabledAdvancedMetricModules(runtime.flags);
    const persistedModules = persisted.success ? [...persisted.data.methodology.enabledModules].sort() : [];
    const modulesChanged = expectedModules.join("|") !== persistedModules.join("|");
    if (result.metrics_version !== ANALYSIS_METRICS_VERSION || !persisted.success || modulesChanged) {
      try { result.calculated_metrics = calculateAdvancedMetrics(result.profile_data as InstagramProfile, result.posts_data as InstagramPost[], runtime.config, runtime.flags); } catch { /* análises legadas continuam com as métricas básicas */ }
    }
  }
  if (result?.id) {
    const runtime = await getAIRuntimeConfig();
    const publicAIEnabled = isOpenAIEnvironmentEnabled() && isOpenAIConfigured() && runtime.config.enabled && runtime.config.publicVisibility !== "hidden" && runtime.flags.profileAnalysis && (!runtime.config.requireRegistration || Boolean(request.user_id)) && Array.isArray(result.posts_data) && result.posts_data.length > 0;
    if (publicAIEnabled) {
      const { data: aiRun } = await admin.from("ai_analysis_runs").select("status,output_snapshot").eq("analysis_result_id", result.id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      const parsedAI = profileAnalysisOutputSchema.safeParse(aiRun?.output_snapshot);
      const hasVisibleFeature = runtime.flags.profileSummary || runtime.flags.bioAnalysis || runtime.flags.recommendations || runtime.flags.contentIdeas || runtime.flags.actionPlanExplanation;
      const aiState = !aiRun ? "preparing" : aiRun.status === "completed" && parsedAI.success ? "completed" : aiRun.status === "processing" ? "processing" : "failed";
      Object.assign(result, { ai_state: aiState });
      if (aiState === "completed" && parsedAI.success && hasVisibleFeature) Object.assign(result, { ai_output: filterAIOutputByFeatures(parsedAI.data, runtime.flags, runtime.config), ai_visibility: runtime.config.publicVisibility });
    }
  }
  const view = buildAnalysisViewModel(request, result);
  if (view.profile && view.posts.length) {
    const context = { isAuthenticated: Boolean(request.user_id), hasAI: Boolean(view.aiAnalysisState) };
    const [access, dashboardModules] = await Promise.all([getFeatureAccessMap(context), getDashboardModules(context)]);
    view.productInsights = buildProfileProductInsights(view.posts, view.profile.followersCount, access);
    view.dashboardModules = dashboardModules;
  }
  return view;
});

export async function getSafeAnalysisStatus(requestId: string, anonymousSessionId: string | undefined) {
  const view = await getAnalysisById(requestId, anonymousSessionId); return view ? { state: view.state, stage: view.stage, aiState: view.aiAnalysisState ?? null } : null;
}
