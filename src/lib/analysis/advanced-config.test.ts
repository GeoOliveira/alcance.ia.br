import { describe, expect, it } from "vitest";
import { defaultAdvancedAnalysisConfig, mergeAdvancedRuntimeConfig } from "./advanced-config";

describe("advanced analysis runtime config", () => {
  it("uses safe defaults and keeps every module disabled without database rows", () => {
    const runtime = mergeAdvancedRuntimeConfig([], []);
    expect(runtime.config).toEqual(defaultAdvancedAnalysisConfig);
    expect(Object.values(runtime.flags).every((enabled) => enabled === false)).toBe(true);
  });

  it("validates types and double-gates content modules", () => {
    const runtime = mergeAdvancedRuntimeConfig([
      { key: "analysis.minimum_posts_for_trend", value: 8 },
      { key: "analysis.minimum_posts_per_format", value: "invalid" },
      { key: "analysis.maximum_action_items", value: 99 },
      { key: "analysis.caption_analysis_enabled", value: true },
      { key: "analysis.cta_analysis_enabled", value: false },
    ], [
      { key: "caption_analysis", enabled: true },
      { key: "cta_analysis", enabled: true },
      { key: "profile_completeness_analysis", enabled: true },
    ]);
    expect(runtime.config.minimumPostsForTrend).toBe(8);
    expect(runtime.config.minimumPostsPerFormat).toBe(defaultAdvancedAnalysisConfig.minimumPostsPerFormat);
    expect(runtime.config.maximumActionItems).toBe(defaultAdvancedAnalysisConfig.maximumActionItems);
    expect(runtime.flags.captionAnalysis).toBe(true);
    expect(runtime.flags.ctaAnalysis).toBe(false);
    expect(runtime.flags.profileCompleteness).toBe(true);
  });
});
