import "server-only";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { AdvancedAnalysisConfig, AdvancedFeatureFlags } from "./metrics";
import { DEFAULT_ENGAGEMENT_CONFIG, type EngagementConfig } from "./engagement";

export const defaultAdvancedAnalysisConfig: AdvancedAnalysisConfig = { minimumPostsForTrend: 6, minimumPostsPerFormat: 3, minimumPostsForCaptionComparison: 3, trendStableThresholdPercent: 10, trendRelevantThresholdPercent: 25, maximumActionItems: 3 };
export const disabledAdvancedFeatureFlags: AdvancedFeatureFlags = { profileCompleteness: false, contentFormat: false, engagementStability: false, recentTrend: false, captionAnalysis: false, ctaAnalysis: false, hashtagAnalysis: false, highlightsAudit: false, deterministicActionPlan: false };
export const developmentAdvancedFeatureFlags: AdvancedFeatureFlags = { profileCompleteness: true, contentFormat: true, engagementStability: true, recentTrend: true, captionAnalysis: true, ctaAnalysis: true, hashtagAnalysis: true, highlightsAudit: true, deterministicActionPlan: true };

const settingMap: Record<string, keyof AdvancedAnalysisConfig> = { "analysis.minimum_posts_for_trend": "minimumPostsForTrend", "analysis.minimum_posts_per_format": "minimumPostsPerFormat", "analysis.minimum_posts_for_caption_comparison": "minimumPostsForCaptionComparison", "analysis.trend_stable_threshold_percent": "trendStableThresholdPercent", "analysis.trend_relevant_threshold_percent": "trendRelevantThresholdPercent", "analysis.maximum_action_items": "maximumActionItems" };
const engagementSettingMap: Record<string, keyof EngagementConfig> = { "analysis.engagement_max_posts": "maxPosts", "analysis.engagement_max_age_days": "maxAgeDays", "analysis.engagement_minimum_posts": "minimumPosts" };
const toggleMap = { "analysis.caption_analysis_enabled": "captionAnalysis", "analysis.hashtag_analysis_enabled": "hashtagAnalysis", "analysis.cta_analysis_enabled": "ctaAnalysis", "analysis.highlights_audit_enabled": "highlightsAudit" } as const;
const flagMap: Record<string, keyof AdvancedFeatureFlags> = { profile_completeness_analysis: "profileCompleteness", content_format_analysis: "contentFormat", engagement_stability_analysis: "engagementStability", recent_trend_analysis: "recentTrend", caption_analysis: "captionAnalysis", cta_analysis: "ctaAnalysis", hashtag_analysis: "hashtagAnalysis", highlights_audit: "highlightsAudit", deterministic_action_plan: "deterministicActionPlan" };
const numericBounds: Record<string, readonly [number, number]> = { "analysis.minimum_posts_for_trend": [4, 50], "analysis.minimum_posts_per_format": [2, 20], "analysis.minimum_posts_for_caption_comparison": [2, 20], "analysis.trend_stable_threshold_percent": [1, 25], "analysis.trend_relevant_threshold_percent": [10, 100], "analysis.maximum_action_items": [1, 5], "analysis.engagement_max_posts": [3, 100], "analysis.engagement_max_age_days": [7, 365], "analysis.engagement_minimum_posts": [3, 12] };
const validInteger = (row: { key: string; value: unknown }) => { const bounds = numericBounds[row.key]; return bounds && typeof row.value === "number" && Number.isInteger(row.value) && row.value >= bounds[0] && row.value <= bounds[1]; };

export function mergeAdvancedRuntimeConfig(settings: Array<{ key: string; value: unknown }>, flags: Array<{ key: string; enabled: boolean }>) {
  const config = { ...defaultAdvancedAnalysisConfig }; const engagementConfig = { ...DEFAULT_ENGAGEMENT_CONFIG }; const features = { ...disabledAdvancedFeatureFlags }; const toggles: Pick<AdvancedFeatureFlags, "captionAnalysis" | "hashtagAnalysis" | "ctaAnalysis" | "highlightsAudit"> = { captionAnalysis: false, hashtagAnalysis: false, ctaAnalysis: false, highlightsAudit: false };
  for (const row of settings) { const target = settingMap[row.key]; if (target && validInteger(row)) config[target] = row.value as number; }
  for (const row of settings) { const target = engagementSettingMap[row.key]; if (target && validInteger(row)) engagementConfig[target] = row.value as number; }
  if (config.trendRelevantThresholdPercent <= config.trendStableThresholdPercent) { config.trendStableThresholdPercent = defaultAdvancedAnalysisConfig.trendStableThresholdPercent; config.trendRelevantThresholdPercent = defaultAdvancedAnalysisConfig.trendRelevantThresholdPercent; }
  for (const row of settings) { const target = toggleMap[row.key as keyof typeof toggleMap]; if (target && typeof row.value === "boolean") toggles[target] = row.value; }
  for (const row of flags) { const target = flagMap[row.key]; if (target) features[target] = row.enabled === true; }
  features.captionAnalysis &&= toggles.captionAnalysis; features.hashtagAnalysis &&= toggles.hashtagAnalysis; features.ctaAnalysis &&= toggles.ctaAnalysis; features.highlightsAudit &&= toggles.highlightsAudit;
  return { config, engagementConfig, flags: features };
}

export const getAdvancedAnalysisRuntimeConfig = unstable_cache(async () => {
  const client = createAdminClient(); if (!client) return { config: defaultAdvancedAnalysisConfig, engagementConfig: DEFAULT_ENGAGEMENT_CONFIG, flags: disabledAdvancedFeatureFlags };
  const [settings, flags] = await Promise.all([client.from("app_settings").select("key,value").in("key", [...Object.keys(settingMap), ...Object.keys(engagementSettingMap), ...Object.keys(toggleMap)]), client.from("feature_flags").select("key,enabled").in("key", Object.keys(flagMap))]);
  if (settings.error || flags.error) return { config: defaultAdvancedAnalysisConfig, engagementConfig: DEFAULT_ENGAGEMENT_CONFIG, flags: disabledAdvancedFeatureFlags };
  return mergeAdvancedRuntimeConfig(settings.data || [], flags.data || []);
}, ["advanced-analysis-runtime-v2"], { tags: ["public-settings", "public-flags"], revalidate: 300 });
