import type { InstagramPost } from "@/lib/social-providers/contracts/instagram-post";
import type { InstagramProfile } from "@/lib/social-providers/contracts/instagram-profile";
import type { AdvancedAnalysisMetrics } from "./metrics";
import type { EngagementConfidence, EngagementExclusionReason } from "./engagement";
import type { AIProfileAnalysisOutput } from "@/lib/ai/contracts/ai-analysis-output";
import type { ProfileProductInsights } from "@/lib/product-features/profile-insights";

export type AnalysisState = "waiting" | "processing" | "completed" | "partial" | "not_found" | "private" | "insufficient_data" | "temporary_error" | "unavailable" | "demo";
export type AnalysisStage = "queued" | "profile" | "content" | "metrics" | "complete";
export type AIAnalysisPublicState = "preparing" | "processing" | "completed" | "failed";
export type AnalysisMetrics = {
  averageLikes: number | null; averageComments: number | null; medianLikes: number | null; medianComments: number | null;
  averageInteractions: number | null; medianInteractions: number | null; estimatedEngagementRate: number | null;
  estimatedTypicalEngagementRate: number | null; averageReelViews: number | null; analyzedPosts: number; validEngagementPosts: number;
  reelsCount: number; imagesCount: number; carouselsCount: number; postsLast7Days: number; postsLast30Days: number;
  averageIntervalDays: number | null; followersFollowingRatio: number | null; mostUsedFormat: string | null;
  bestObservedFormat: string | null; engagementLabel: string; engagementConfidence: EngagementConfidence; consistencyLabel: string; contentLabel: string;
  engagementFormulaVersion: string; engagementCalculatedAt: string; followersCountUsed: number | null;
  engagementMaxPosts: number; engagementMaxAgeDays: number; engagementExclusions: Record<EngagementExclusionReason, number>;
  minimumInteractions: number | null; maximumInteractions: number | null; meanMedianRatio: number | null;
  topPostShare: number | null; topThreeShare: number | null;
};
export type AnalysisObservation = { id: string; title: string; message: string; tone: "positive" | "attention" | "neutral" };
export type AnalysisViewModel = {
  requestId: string; state: AnalysisState; stage: AnalysisStage; username: string; profileUrl: string; requestedAt: string;
  analyzedAt: string | null; profile: InstagramProfile | null; posts: InstagramPost[]; metrics: AnalysisMetrics | null;
  observations: AnalysisObservation[]; topPosts: InstagramPost[]; isCached: boolean; statusMessage: string;
  advancedMetrics?: AdvancedAnalysisMetrics;
  aiAnalysisState?: AIAnalysisPublicState;
  aiAnalysis?: AIProfileAnalysisOutput;
  aiAnalysisVisibility?: "preview" | "full";
  productInsights?: ProfileProductInsights;
};
