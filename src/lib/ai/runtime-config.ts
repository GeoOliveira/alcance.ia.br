import "server-only";
import { unstable_cache } from "next/cache";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const confidence = z.enum(["low", "medium", "high"]);
const runtimeSchema = z.strictObject({
  enabled: z.boolean(), profileSummaryEnabled: z.boolean(), bioAnalysisEnabled: z.boolean(), recommendationsEnabled: z.boolean(), contentIdeasEnabled: z.boolean(), actionPlanExplanationEnabled: z.boolean(),
  maximumRecommendations: z.number().int().min(1).max(5), maximumContentIdeas: z.number().int().min(1).max(5), minimumAnalysisConfidence: confidence, cacheHours: z.number().int().min(1).max(720), dailyRequestLimit: z.number().int().min(1).max(10000), retryEnabled: z.boolean(), publicVisibility: z.enum(["hidden", "preview", "full"]), requireRegistration: z.boolean(), engagementInterpretationAudited: z.boolean(),
});
export type AIRuntimeConfig = z.infer<typeof runtimeSchema>;

export const defaultAIRuntimeConfig: AIRuntimeConfig = { enabled: false, profileSummaryEnabled: true, bioAnalysisEnabled: true, recommendationsEnabled: true, contentIdeasEnabled: true, actionPlanExplanationEnabled: true, maximumRecommendations: 5, maximumContentIdeas: 5, minimumAnalysisConfidence: "medium", cacheHours: 24, dailyRequestLimit: 100, retryEnabled: true, publicVisibility: "hidden", requireRegistration: false, engagementInterpretationAudited: true };

export type AIFeatureFlags = { profileAnalysis: boolean; profileSummary: boolean; bioAnalysis: boolean; recommendations: boolean; contentIdeas: boolean; actionPlanExplanation: boolean };
export const disabledAIFeatureFlags: AIFeatureFlags = { profileAnalysis: false, profileSummary: false, bioAnalysis: false, recommendations: false, contentIdeas: false, actionPlanExplanation: false };

const settingMap: Record<string, keyof AIRuntimeConfig> = {
  "ai.enabled": "enabled", "ai.profile_summary_enabled": "profileSummaryEnabled", "ai.bio_analysis_enabled": "bioAnalysisEnabled", "ai.recommendations_enabled": "recommendationsEnabled", "ai.content_ideas_enabled": "contentIdeasEnabled", "ai.action_plan_explanation_enabled": "actionPlanExplanationEnabled", "ai.maximum_recommendations": "maximumRecommendations", "ai.maximum_content_ideas": "maximumContentIdeas", "ai.minimum_analysis_confidence": "minimumAnalysisConfidence", "ai.cache_hours": "cacheHours", "ai.daily_request_limit": "dailyRequestLimit", "ai.retry_enabled": "retryEnabled", "ai.public_visibility": "publicVisibility", "ai.require_registration": "requireRegistration", "ai.engagement_interpretation_audited": "engagementInterpretationAudited",
};
const flagMap: Record<string, keyof AIFeatureFlags> = { ai_profile_analysis: "profileAnalysis", ai_profile_summary: "profileSummary", ai_bio_analysis: "bioAnalysis", ai_recommendations: "recommendations", ai_content_ideas: "contentIdeas", ai_action_plan_explanation: "actionPlanExplanation" };

export function mergeAIRuntimeConfig(settings: Array<{ key: string; value: unknown }>, flags: Array<{ key: string; enabled: boolean }>) {
  const candidate: Record<string, unknown> = { ...defaultAIRuntimeConfig };
  for (const row of settings) { const key = settingMap[row.key]; if (key) candidate[key] = row.value; }
  const parsed = runtimeSchema.safeParse(candidate);
  if (!parsed.success) return { config: defaultAIRuntimeConfig, flags: disabledAIFeatureFlags };
  const features = { ...disabledAIFeatureFlags };
  for (const row of flags) { const key = flagMap[row.key]; if (key) features[key] = row.enabled === true; }
  features.profileSummary &&= parsed.data.profileSummaryEnabled; features.bioAnalysis &&= parsed.data.bioAnalysisEnabled; features.recommendations &&= parsed.data.recommendationsEnabled; features.contentIdeas &&= parsed.data.contentIdeasEnabled; features.actionPlanExplanation &&= parsed.data.actionPlanExplanationEnabled;
  return { config: parsed.data, flags: features };
}

export const getAIRuntimeConfig = unstable_cache(async () => {
  const client = createAdminClient(); if (!client) return { config: defaultAIRuntimeConfig, flags: disabledAIFeatureFlags };
  const [settings, flags] = await Promise.all([client.from("app_settings").select("key,value").in("key", Object.keys(settingMap)), client.from("feature_flags").select("key,enabled").in("key", Object.keys(flagMap))]);
  if (settings.error || flags.error) return { config: defaultAIRuntimeConfig, flags: disabledAIFeatureFlags };
  return mergeAIRuntimeConfig(settings.data || [], flags.data || []);
}, ["ai-runtime-v1"], { tags: ["public-settings", "public-flags"], revalidate: 300 });
