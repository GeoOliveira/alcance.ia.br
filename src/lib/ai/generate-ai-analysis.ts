import "server-only";
import { randomUUID } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { persistedAdvancedMetricsSchema } from "@/lib/analysis/metrics";
import type { AnalysisMetrics, AnalysisObservation } from "@/lib/analysis/types";
import type { InstagramPost } from "@/lib/social-providers/contracts/instagram-post";
import type { InstagramProfile } from "@/lib/social-providers/contracts/instagram-profile";
import type { AIProvider } from "./contracts/ai-provider";
import { assertAIAnalysisConsistency } from "./guards/metric-consistency";
import { sanitizeAIAnalysisOutput } from "./guards/output-sanitizer";
import { filterAIOutputByFeatures } from "./guards/feature-filter";
import { prepareSanitizedAIAnalysisInput } from "./prepare-analysis-input";
import { createOpenAIProvider } from "./providers/openai/client";
import { getConfiguredModelName, isOpenAIEnvironmentEnabled } from "./providers/openai/config";
import { AIAnalysisValidationError, AIIntegrationError } from "./providers/openai/errors";
import { PROFILE_ANALYSIS_PROMPT_VERSION } from "./prompts/prompt-version";
import { AI_ANALYSIS_SCHEMA_VERSION, profileAnalysisOutputSchema } from "./schemas/profile-analysis-schema";
import { getAIRuntimeConfig } from "./runtime-config";
import { hashAIAnalysisInput, runWithSingleRetry } from "./execution-utils";

type RequestedFeature = "summary" | "bioAnalysis" | "recommendations" | "contentIdeas" | "actionPlanExplanation";
type GenerateOptions = { force?: boolean; bypassCache?: boolean; provider?: AIProvider; requestedBy?: string | null; source?: "automatic" | "admin"; requestedFeatures?: RequestedFeature[] };
const confidenceRank = { low: 0, medium: 1, high: 2 } as const;

export async function generateAIAnalysisForRequest(requestId: string, options: GenerateOptions = {}) {
  const executionId = randomUUID(); const admin = createAdminClient(); if (!admin) return { ok: false as const, code: "unavailable" };
  const runtime = await getAIRuntimeConfig(); const enabled = isOpenAIEnvironmentEnabled() && runtime.config.enabled && runtime.flags.profileAnalysis;
  if (!enabled && !options.force) return { ok: false as const, code: "disabled" };
  const { data: row, error } = await admin.from("analysis_results").select("id,request_id,data_quality,profile_data,posts_data,metrics,observations,metrics_version,engagement_formula_version,calculated_metrics,calculation_status").eq("request_id", requestId).maybeSingle();
  if (error || !row) return { ok: false as const, code: "not_found" };
  if (row.data_quality === "private" || row.calculation_status === "failed" || !row.profile_data || !Array.isArray(row.posts_data) || row.posts_data.length === 0) return { ok: false as const, code: "insufficient_data" };
  if (runtime.config.requireRegistration) { const { data: request } = await admin.from("analysis_requests").select("user_id").eq("id", requestId).maybeSingle(); if (!request?.user_id) return { ok: false as const, code: "registration_required" }; }
  const enabledFeatures: RequestedFeature[] = options.requestedFeatures?.length ? options.requestedFeatures : [runtime.flags.profileSummary && "summary", runtime.flags.bioAnalysis && "bioAnalysis", runtime.flags.recommendations && "recommendations", runtime.flags.contentIdeas && "contentIdeas", runtime.flags.actionPlanExplanation && "actionPlanExplanation"].filter((item): item is RequestedFeature => Boolean(item));
  if (!enabledFeatures.length) return { ok: false as const, code: "disabled" };
  const advanced = persistedAdvancedMetricsSchema.safeParse(row.calculated_metrics); const input = prepareSanitizedAIAnalysisInput({ analysisId: row.id, profile: row.profile_data as InstagramProfile, posts: row.posts_data as InstagramPost[], metrics: row.metrics as AnalysisMetrics, observations: row.observations as AnalysisObservation[], advancedMetrics: advanced.success ? advanced.data : undefined, engagementMetricsAudited: runtime.config.engagementInterpretationAudited, requestedFeatures: enabledFeatures });
  if (confidenceRank[input.analysisContext.dataConfidence] < confidenceRank[runtime.config.minimumAnalysisConfidence]) return { ok: false as const, code: "insufficient_confidence" };
  const model = getConfiguredModelName(); if (!model) return { ok: false as const, code: "configuration" };
  const inputHash = hashAIAnalysisInput(input);
  if (!options.bypassCache) { const cutoff = new Date(Date.now() - runtime.config.cacheHours * 3_600_000).toISOString(); const { data: cached } = await admin.from("ai_analysis_runs").select("id,status,output_snapshot,created_at").eq("analysis_result_id", row.id).eq("input_hash", inputHash).eq("model", model).eq("prompt_version", PROFILE_ANALYSIS_PROMPT_VERSION).eq("schema_version", AI_ANALYSIS_SCHEMA_VERSION).eq("status", "completed").gte("created_at", cutoff).order("created_at", { ascending: false }).limit(1).maybeSingle(); if (cached) { await admin.from("ai_analysis_runs").update({ cache_hit: true }).eq("id", cached.id); return { ok: true as const, cached: true, executionId: cached.id, output: cached.output_snapshot }; } }
  const today = new Date(); today.setUTCHours(0, 0, 0, 0); const { count: executionsToday } = await admin.from("ai_analysis_runs").select("id", { count: "exact", head: true }).gte("created_at", today.toISOString()); if ((executionsToday || 0) >= runtime.config.dailyRequestLimit) return { ok: false as const, code: "daily_limit" };
  const insert = await admin.from("ai_analysis_runs").insert({ id: executionId, analysis_result_id: row.id, request_id: requestId, provider: "openai", model, prompt_version: PROFILE_ANALYSIS_PROMPT_VERSION, schema_version: AI_ANALYSIS_SCHEMA_VERSION, metrics_version: row.metrics_version || "legacy", engagement_formula_version: row.engagement_formula_version || "legacy", input_hash: inputHash, input_snapshot: input, status: "processing", source: options.source || "automatic", requested_by: options.requestedBy || null, started_at: new Date().toISOString() });
  if (insert.error) return { ok: false as const, code: "deduplicated" };
  try {
    const provider = options.provider || createOpenAIProvider(executionId); const attempt = await runWithSingleRetry(() => provider.generateProfileAnalysis(input), runtime.config.retryEnabled); const result = attempt.value; const retryCount = attempt.retryCount;
    const local = profileAnalysisOutputSchema.safeParse(result.output); if (!local.success) throw new AIAnalysisValidationError(executionId, { issues: local.error.issues.slice(0, 8).map((issue) => issue.code) });
    const output = sanitizeAIAnalysisOutput(local.data); assertAIAnalysisConsistency(input, output, executionId);
    const selectedFlags = { ...runtime.flags, profileSummary: enabledFeatures.includes("summary"), bioAnalysis: enabledFeatures.includes("bioAnalysis"), recommendations: enabledFeatures.includes("recommendations"), contentIdeas: enabledFeatures.includes("contentIdeas"), actionPlanExplanation: enabledFeatures.includes("actionPlanExplanation") };
    const limited = filterAIOutputByFeatures(output, selectedFlags, runtime.config);
    await admin.from("ai_analysis_runs").update({ status: "completed", output_snapshot: limited, provider_response_id: result.providerResponseId, input_tokens: result.usage.inputTokens, output_tokens: result.usage.outputTokens, total_tokens: result.usage.totalTokens, duration_ms: result.durationMs, retry_count: retryCount, completed_at: new Date().toISOString(), validation_status: "passed", consistency_status: "passed" }).eq("id", executionId);
    return { ok: true as const, cached: false, executionId, output: limited };
  } catch (caught) {
    const aiError = caught instanceof AIIntegrationError ? caught : null; await admin.from("ai_analysis_runs").update({ status: aiError?.retryable ? "retryable_failed" : "failed", error_code: aiError?.code || "unexpected_error", error_message: aiError?.message || "Falha inesperada na interpretação por IA.", duration_ms: aiError?.durationMs || null, completed_at: new Date().toISOString(), validation_status: aiError?.code === "ai_validation" ? "failed" : "not_run", consistency_status: aiError?.code === "ai_consistency" ? "failed" : "not_run" }).eq("id", executionId); return { ok: false as const, code: aiError?.code || "unexpected_error", executionId };
  }
}
