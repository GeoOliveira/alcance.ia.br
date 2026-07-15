import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchFromScrapeCreators } from "@/lib/social-providers";
import { ScrapeCreatorsError } from "@/lib/social-providers/scrape-creators/errors";
import type { InstagramPost } from "@/lib/social-providers/contracts/instagram-post";
import type { InstagramProfile } from "@/lib/social-providers/contracts/instagram-profile";
import { buildObservations, calculateAnalysisMetrics } from "./analysis-metrics";
import { getAdvancedAnalysisRuntimeConfig } from "./advanced-config";
import { ANALYSIS_METRICS_VERSION, calculateAdvancedMetrics } from "./metrics";
import { deduplicatePosts } from "./deduplicate-posts";
import { ENGAGEMENT_FORMULA_VERSION } from "./engagement";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type DatabaseResult = { error: { message: string } | null };

function assertDatabaseWrite(result: DatabaseResult) {
  if (result.error) throw new Error("analysis_database_write_failed");
}

export async function processAnalysis(requestId: string, anonymousSessionId: string | undefined) {
  if (!uuid.test(requestId) || !anonymousSessionId || !uuid.test(anonymousSessionId)) return { ok: false as const, code: "not_found" };
  const admin = createAdminClient(); if (!admin) return { ok: false as const, code: "unavailable" };
  const { data: request, error: requestError } = await admin.from("analysis_requests").select("id,instagram_username,status,metadata,anonymous_session_id").eq("id", requestId).maybeSingle();
  if (requestError) return { ok: false as const, code: "unavailable" };
  if (!request || request.anonymous_session_id !== anonymousSessionId) return { ok: false as const, code: "not_found" };
  if (request.status === "completed") return { ok: true as const, cached: true };
  if (request.status === "processing") return { ok: true as const, processing: true };
  const metadata = (request.metadata || {}) as Record<string, unknown>;
  const claimed = await admin.from("analysis_requests").update({ status: "processing", metadata: { ...metadata, phase: "real_analysis", analysis_stage: "profile", analysis_error_code: null } }).eq("id", requestId).in("status", ["pending", "preview_ready"]).select("id").maybeSingle();
  if (claimed.error) return { ok: false as const, code: "unavailable" };
  if (!claimed.data) return { ok: true as const, processing: true };
  const updateStage = async (stage: string) => {
    const result = await admin.from("analysis_requests").update({ metadata: { ...metadata, phase: "real_analysis", analysis_stage: stage } }).eq("id", requestId);
    assertDatabaseWrite(result);
  };
  try {
    const configuredCache = Number(process.env.ANALYSIS_RESULT_CACHE_MINUTES || "30"); const cacheMinutes = Number.isInteger(configuredCache) && configuredCache >= 0 && configuredCache <= 1440 ? configuredCache : 30;
    if (cacheMinutes > 0) {
      const cutoff = new Date(Date.now() - cacheMinutes * 60_000).toISOString();
      const { data: recent, error: recentError } = await admin.from("analysis_requests").select("id").eq("instagram_username", request.instagram_username).eq("status", "completed").neq("id", requestId).gte("updated_at", cutoff).order("updated_at", { ascending: false }).limit(1).maybeSingle();
      if (recentError) throw new Error("analysis_cache_lookup_failed");
      if (recent) {
        const { data: cached, error: cachedError } = await admin.from("analysis_results").select("provider,data_quality,profile_data,posts_data,metrics,metrics_history,observations,items_count,fetched_at,source_metadata,metrics_version,engagement_formula_version,engagement_calculated_at,calculated_metrics,calculation_status,calculation_started_at,calculation_completed_at,calculation_error").eq("request_id", recent.id).maybeSingle();
        if (cachedError) throw new Error("analysis_cache_read_failed");
        if (cached) {
          const runtime = await getAdvancedAnalysisRuntimeConfig();
          const cachedProfile = cached.profile_data as InstagramProfile;
          const cachedPosts = Array.isArray(cached.posts_data) ? cached.posts_data as InstagramPost[] : [];
          const recalculatedMetrics = calculateAdvancedMetrics(cachedProfile, cachedPosts, runtime.config, runtime.flags);
          const cachedWrite = await admin.from("analysis_results").upsert({ ...cached, request_id: requestId, metrics_version: ANALYSIS_METRICS_VERSION, calculated_metrics: recalculatedMetrics, calculation_status: recalculatedMetrics.methodology.enabledModules.length ? "complete" : "unavailable", calculation_started_at: recalculatedMetrics.methodology.calculatedAt, calculation_completed_at: new Date().toISOString(), calculation_error: null, source_metadata: { ...(cached.source_metadata as Record<string, unknown>), used_cache: true } }, { onConflict: "request_id" });
          assertDatabaseWrite(cachedWrite);
          const completedWrite = await admin.from("analysis_requests").update({ status: "completed", metadata: { ...metadata, phase: "real_analysis", analysis_stage: "complete", analysis_error_code: null, data_quality: cached.data_quality } }).eq("id", requestId);
          assertDatabaseWrite(completedWrite);
          return { ok: true as const, cached: true };
        }
      }
    }
    const profileResult = await fetchFromScrapeCreators("profile", request.instagram_username, 1); const profile = profileResult.data as InstagramProfile;
    if (profile.isPrivate) {
      const privateResultWrite = await admin.from("analysis_results").upsert({ request_id: requestId, provider: "scrapecreators", data_quality: "private", profile_data: profile, posts_data: [], metrics: {}, observations: [], items_count: 0, fetched_at: profileResult.metadata.fetchedAt, source_metadata: { calls: profileResult.metadata.calls }, calculation_status: "unavailable", calculation_error: "private_profile" }, { onConflict: "request_id" });
      assertDatabaseWrite(privateResultWrite);
      const privateStatusWrite = await admin.from("analysis_requests").update({ status: "failed", metadata: { ...metadata, phase: "real_analysis", analysis_stage: "complete", analysis_error_code: "private_profile" } }).eq("id", requestId);
      assertDatabaseWrite(privateStatusWrite);
      return { ok: true as const, private: true };
    }
    await updateStage("content");
    const [postsResult, reelsResult] = await Promise.allSettled([fetchFromScrapeCreators("posts", request.instagram_username, 1), fetchFromScrapeCreators("reels", request.instagram_username, 1)]);
    const posts = postsResult.status === "fulfilled" && Array.isArray(postsResult.value.data) ? postsResult.value.data as InstagramPost[] : [];
    const reels = reelsResult.status === "fulfilled" && Array.isArray(reelsResult.value.data) ? reelsResult.value.data as InstagramPost[] : [];
    const deduplication = deduplicatePosts([...posts, ...reels]); const content = deduplication.posts; if (!content.length && postsResult.status === "rejected" && reelsResult.status === "rejected") throw postsResult.reason;
    const runtime = await getAdvancedAnalysisRuntimeConfig();
    await updateStage("metrics"); const metrics = calculateAnalysisMetrics(profile, content, new Date(), runtime.engagementConfig); const observations = buildObservations(profile, content, metrics);
    const calculationStartedAt = new Date(); let calculatedMetrics = null; let calculationStatus: "complete" | "unavailable" | "failed" = "unavailable"; let calculationError: string | null = null;
    try { calculatedMetrics = calculateAdvancedMetrics(profile, content, runtime.config, runtime.flags, calculationStartedAt); calculationStatus = calculatedMetrics.methodology.enabledModules.length ? "complete" : "unavailable"; }
    catch { calculationStatus = "failed"; calculationError = "deterministic_calculation_failed"; }
    const partial = postsResult.status === "rejected" || reelsResult.status === "rejected"; const quality = content.length < 3 ? "insufficient" : partial ? "partial" : "complete";
    const calls = profileResult.metadata.calls + (postsResult.status === "fulfilled" ? postsResult.value.metadata.calls : 0) + (reelsResult.status === "fulfilled" ? reelsResult.value.metadata.calls : 0);
    const resultWrite = await admin.from("analysis_results").upsert({ request_id: requestId, provider: "scrapecreators", data_quality: quality, profile_data: profile, posts_data: content, metrics, observations, items_count: content.length,
      fetched_at: new Date().toISOString(), source_metadata: { calls, partial, posts_available: postsResult.status === "fulfilled", reels_available: reelsResult.status === "fulfilled", used_cache: false, deduplication: { duplicates_merged: deduplication.duplicatesMerged, unidentified_discarded: deduplication.unidentifiedDiscarded } }, metrics_version: ANALYSIS_METRICS_VERSION, engagement_formula_version: ENGAGEMENT_FORMULA_VERSION, engagement_calculated_at: metrics.engagementCalculatedAt, calculated_metrics: calculatedMetrics, calculation_status: calculationStatus, calculation_started_at: calculationStartedAt.toISOString(), calculation_completed_at: new Date().toISOString(), calculation_error: calculationError }, { onConflict: "request_id" });
    assertDatabaseWrite(resultWrite);
    const completedWrite = await admin.from("analysis_requests").update({ status: "completed", metadata: { ...metadata, phase: "real_analysis", analysis_stage: "complete", analysis_error_code: null, data_quality: quality } }).eq("id", requestId);
    assertDatabaseWrite(completedWrite);
    return { ok: true as const, complete: true };
  } catch (error) {
    const code = error instanceof ScrapeCreatorsError ? error.code : "provider_error"; const publicCode = code === "not_found" ? "not_found" : code === "configuration" ? "unavailable" : code;
    await admin.from("analysis_requests").update({ status: "failed", metadata: { ...metadata, phase: "real_analysis", analysis_stage: "complete", analysis_error_code: publicCode } }).eq("id", requestId);
    return { ok: false as const, code: publicCode };
  }
}
