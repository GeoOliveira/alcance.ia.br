import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { InstagramPost } from "@/lib/social-providers/contracts/instagram-post";
import type { InstagramProfile } from "@/lib/social-providers/contracts/instagram-profile";
import { buildObservations, calculateAnalysisMetrics } from "./analysis-metrics";
import { getAdvancedAnalysisRuntimeConfig } from "./advanced-config";
import { ANALYSIS_METRICS_VERSION, calculateAdvancedMetrics } from "./metrics";
import { ENGAGEMENT_FORMULA_VERSION } from "./engagement";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function recalculateAnalysisMetrics(requestId: string) {
  if (!uuid.test(requestId)) return { ok: false as const, code: "invalid_id" };
  const admin = createAdminClient(); if (!admin) return { ok: false as const, code: "unavailable" };
  const { data, error } = await admin.from("analysis_results").select("profile_data,posts_data,metrics,metrics_history,metrics_version,engagement_formula_version").eq("request_id", requestId).maybeSingle();
  if (error || !data?.profile_data || !Array.isArray(data.posts_data)) return { ok: false as const, code: "normalized_data_unavailable" };
  const startedAt = new Date();
  try {
    const profile = data.profile_data as InstagramProfile, posts = data.posts_data as InstagramPost[]; const runtime = await getAdvancedAnalysisRuntimeConfig(); const metrics = calculateAnalysisMetrics(profile, posts, startedAt, runtime.engagementConfig); const observations = buildObservations(profile, posts, metrics); const advanced = calculateAdvancedMetrics(profile, posts, runtime.config, runtime.flags, startedAt);
    const existingHistory = Array.isArray(data.metrics_history) ? data.metrics_history : []; const historyEntry = data.metrics && typeof data.metrics === "object" ? [{ formulaVersion: data.engagement_formula_version ?? "legacy-v1", preservedAt: startedAt.toISOString(), metrics: data.metrics }] : [];
    const { error: writeError } = await admin.from("analysis_results").update({ metrics, metrics_history: [...existingHistory, ...historyEntry].slice(-10), observations, metrics_version: ANALYSIS_METRICS_VERSION, engagement_formula_version: ENGAGEMENT_FORMULA_VERSION, engagement_calculated_at: metrics.engagementCalculatedAt, calculated_metrics: advanced, calculation_status: advanced.methodology.enabledModules.length ? "complete" : "unavailable", calculation_started_at: startedAt.toISOString(), calculation_completed_at: new Date().toISOString(), calculation_error: null }).eq("request_id", requestId);
    if (writeError) return { ok: false as const, code: "write_failed" };
    return { ok: true as const, previousVersion: data.engagement_formula_version as string | null ?? "legacy-v1", version: ENGAGEMENT_FORMULA_VERSION, postsConsidered: metrics.validEngagementPosts, durationMs: advanced.methodology.calculationDurationMs };
  } catch {
    await admin.from("analysis_results").update({ calculation_status: "failed", calculation_completed_at: new Date().toISOString(), calculation_error: "deterministic_calculation_failed" }).eq("request_id", requestId);
    return { ok: false as const, code: "calculation_failed" };
  }
}
