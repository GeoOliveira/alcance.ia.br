import type { InstagramPost } from "@/lib/social-providers/contracts/instagram-post";

export type ConfidenceLevel = "high" | "medium" | "low" | "unavailable";
export type Confidence = { level: ConfidenceLevel; sampleSize: number; reason: string };
export type Availability = { available: boolean; explanationCode: string; confidence: Confidence };
export type ContentFormat = "reel" | "image" | "carousel" | "unknown";
export type MetricPriority = "high" | "medium" | "low";

export type ProfileCompletenessResult = Availability & { score: number | null; classification: "incomplete" | "basic" | "well_filled" | "complete" | "unavailable"; completedCriteria: string[]; missingCriteria: string[]; availableCriteria: string[] };
export type FollowerFollowingRatioResult = Availability & { ratio: number | null; description: string };
export type ContentDiversityResult = Availability & { counts: Record<ContentFormat, number>; percentages: Record<ContentFormat, number | null>; predominantFormat: ContentFormat | null; formatsUsed: number; classification: "concentrated" | "moderately_diverse" | "diverse" | "insufficient" };
export type FormatPerformanceResult = Availability & { format: ContentFormat; postsCount: number; averageLikes: number | null; medianLikes: number | null; averageComments: number | null; medianComments: number | null; averageViews: number | null; medianViews: number | null; averageEngagementRate: number | null; bestPostId: string | null; variability: number | null };
export type EngagementStabilityResult = Availability & { classification: "stable" | "moderately_variable" | "highly_variable" | "insufficient"; coefficientOfVariation: number | null; meanMedianRatio: number | null; range: number | null; outliersCount: number; explanation: string };
export type PerformanceConcentrationResult = Availability & { topPostPercent: number | null; topThreePercent: number | null; topTwentyPercent: number | null; classification: "distributed" | "partially_concentrated" | "highly_concentrated" | "insufficient"; totalInteractions: number | null };
export type TrendComparison = { metric: "likes" | "comments" | "engagement" | "reel_views" | "frequency"; older: number | null; recent: number | null; changePercent: number | null };
export type RecentTrendResult = Availability & { classification: "improving" | "stable" | "apparent_decline" | "insufficient"; magnitude: "stable" | "moderate" | "relevant" | "unavailable"; comparisons: TrendComparison[]; olderGroupSize: number; recentGroupSize: number };
export type PublishingRegularityResult = Availability & { postsLast7Days: number; postsLast30Days: number; postsLast90Days: number; last7ShareOf30Percent: number | null; weeklyAverage: number | null; averageIntervalDays: number | null; medianIntervalDays: number | null; longestGapDays: number | null; activeWeeks: number; inactiveWeeks: number; classification: "consistent" | "moderately_consistent" | "irregular" | "recently_inactive" | "insufficient" };
export type CaptionAnalysisResult = Availability & { captionsCount: number; emptyCaptions: number; averageLength: number | null; medianLength: number | null; withParagraphsPercent: number | null; withQuestionsPercent: number | null; withEmojisPercent: number | null; averageMentions: number | null; averageHashtags: number | null; veryShortPercent: number | null; longPercent: number | null; typicalLength: "short" | "medium" | "long" | "unavailable" };
export type CtaCategory = "interaction" | "sharing" | "saving" | "click" | "contact" | "following";
export type CtaAnalysisResult = Availability & { postsWithCta: number; postsWithoutCta: number; percentageWithCta: number | null; mostFrequent: string[]; categories: Array<{ category: CtaCategory; count: number }> };
export type HashtagAnalysisResult = Availability & { averagePerPost: number | null; medianPerPost: number | null; postsWithoutHashtags: number; mostUsed: Array<{ hashtag: string; count: number }>; repeatedHashtags: number; uniqueHashtags: number; topHashtagsConcentrationPercent: number | null; withHashtagsAverageInteractions: number | null; withoutHashtagsAverageInteractions: number | null };
export type HighlightsAuditResult = Availability & { count: number | null; categoriesFound: string[]; categoriesMissing: string[]; duplicateTitles: string[]; emptyTitles: number | null };
export type ActionPlanItem = { id: string; priority: MetricPriority; category: "profile" | "bio" | "consistency" | "formats" | "engagement" | "captions" | "cta" | "hashtags" | "highlights"; title: string; description: string; evidence: string; suggestedAction: string; confidence: Confidence; sourceMetrics: string[] };
export type AnalysisMethodologyV2 = { metricsVersion: string; calculatedAt: string; postsConsidered: number; reelsConsidered: number; observedWindow: { from: string | null; to: string | null; days: number | null }; missingFields: string[]; calculationDurationMs: number; enabledModules: string[]; highlightsCollected: false };

export type AdvancedAnalysisMetrics = {
  methodology: AnalysisMethodologyV2;
  profileCompleteness?: ProfileCompletenessResult;
  followerFollowingRatio?: FollowerFollowingRatioResult;
  contentDiversity?: ContentDiversityResult;
  formatPerformance?: FormatPerformanceResult[];
  engagementStability?: EngagementStabilityResult;
  performanceConcentration?: PerformanceConcentrationResult;
  recentTrend?: RecentTrendResult;
  publishingRegularity?: PublishingRegularityResult;
  captionAnalysis?: CaptionAnalysisResult;
  ctaAnalysis?: CtaAnalysisResult;
  hashtagAnalysis?: HashtagAnalysisResult;
  highlightsAudit?: HighlightsAuditResult;
  actionPlan?: ActionPlanItem[];
};

export type AdvancedAnalysisConfig = { minimumPostsForTrend: number; minimumPostsPerFormat: number; minimumPostsForCaptionComparison: number; trendStableThresholdPercent: number; trendRelevantThresholdPercent: number; maximumActionItems: number };
export type AdvancedFeatureFlags = { profileCompleteness: boolean; contentFormat: boolean; engagementStability: boolean; recentTrend: boolean; captionAnalysis: boolean; ctaAnalysis: boolean; hashtagAnalysis: boolean; highlightsAudit: boolean; deterministicActionPlan: boolean };
export type MetricContext = { now: Date; followersCount: number | null; config: AdvancedAnalysisConfig };

export function postFormat(post: InstagramPost): ContentFormat { return post.mediaType === "video" ? "reel" : post.mediaType; }
