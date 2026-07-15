import type { InstagramPost } from "@/lib/social-providers/contracts/instagram-post";
import type { InstagramProfile } from "@/lib/social-providers/contracts/instagram-profile";
import { calculateCaptionAnalysis } from "./caption-analysis";
import { calculateContentDiversity } from "./content-diversity";
import { calculateCtaAnalysis } from "./cta-analysis";
import { calculateEngagementStability } from "./engagement-stability";
import { calculateFollowerFollowingRatio } from "./follower-following-ratio";
import { calculateFormatPerformance } from "./format-performance";
import { calculateHashtagAnalysis } from "./hashtag-analysis";
import { unavailableHighlightsAudit } from "./highlights-audit";
import { calculatePerformanceConcentration } from "./performance-concentration";
import { calculateProfileCompleteness } from "./profile-completeness";
import { calculatePublishingRegularity } from "./publishing-regularity";
import { calculateRecentTrend } from "./recent-trend";
import { buildActionPlan } from "./action-plan";
import { validDates } from "./common";
import { ANALYSIS_METRICS_VERSION } from "./version";
import type { AdvancedAnalysisConfig, AdvancedAnalysisMetrics, AdvancedFeatureFlags, MetricContext } from "./types";

export function calculateAdvancedMetrics(profile: InstagramProfile, posts: InstagramPost[], config: AdvancedAnalysisConfig, flags: AdvancedFeatureFlags, now = new Date()): AdvancedAnalysisMetrics {
  const started = performance.now(); const context: MetricContext = { now, followersCount: profile.followersCount, config }; const dates = validDates(posts.map((post) => post.publishedAt)); const from = dates[0] ?? null, to = dates.at(-1) ?? null; const enabledModules = Object.entries(flags).filter(([, enabled]) => enabled).map(([key]) => key); const missingFields = [profile.followersCount === null ? "profile.followersCount" : null, profile.followingCount === null ? "profile.followingCount" : null, posts.some((post) => post.likeCount === null) ? "posts.likeCount.partial" : null, posts.some((post) => post.commentCount === null) ? "posts.commentCount.partial" : null, posts.some((post) => !post.publishedAt) ? "posts.publishedAt.partial" : null, posts.some((post) => !post.caption) ? "posts.caption.partial" : null].filter((value): value is string => Boolean(value));
  const result: AdvancedAnalysisMetrics = { methodology: { metricsVersion: ANALYSIS_METRICS_VERSION, calculatedAt: now.toISOString(), postsConsidered: posts.length, reelsConsidered: posts.filter((post) => post.mediaType === "video").length, observedWindow: { from: from?.toISOString() ?? null, to: to?.toISOString() ?? null, days: from && to ? Math.round((to.getTime() - from.getTime()) / 86_400_000) : null }, missingFields, calculationDurationMs: 0, enabledModules, highlightsCollected: false } };
  if (flags.profileCompleteness) { result.profileCompleteness = calculateProfileCompleteness(profile); result.followerFollowingRatio = calculateFollowerFollowingRatio(profile); }
  if (flags.contentFormat) { result.contentDiversity = calculateContentDiversity(posts); result.formatPerformance = calculateFormatPerformance(posts, context); }
  if (flags.engagementStability) { result.engagementStability = calculateEngagementStability(posts); result.performanceConcentration = calculatePerformanceConcentration(posts); result.publishingRegularity = calculatePublishingRegularity(posts, now); }
  if (flags.recentTrend) result.recentTrend = calculateRecentTrend(posts, context);
  if (flags.captionAnalysis) result.captionAnalysis = calculateCaptionAnalysis(posts);
  if (flags.ctaAnalysis) result.ctaAnalysis = calculateCtaAnalysis(posts);
  if (flags.hashtagAnalysis) result.hashtagAnalysis = calculateHashtagAnalysis(posts, config.minimumPostsForCaptionComparison);
  if (flags.highlightsAudit) result.highlightsAudit = unavailableHighlightsAudit();
  if (flags.deterministicActionPlan) result.actionPlan = buildActionPlan(profile, result, config.maximumActionItems);
  result.methodology.calculationDurationMs = Math.round((performance.now() - started) * 100) / 100;
  return result;
}
