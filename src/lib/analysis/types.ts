import type { InstagramPost } from "@/lib/social-providers/contracts/instagram-post";
import type { InstagramProfile } from "@/lib/social-providers/contracts/instagram-profile";

export type AnalysisState = "waiting" | "processing" | "completed" | "partial" | "not_found" | "private" | "insufficient_data" | "temporary_error" | "unavailable" | "demo";
export type AnalysisStage = "queued" | "profile" | "content" | "metrics" | "complete";
export type AnalysisMetrics = {
  averageLikes: number | null; averageComments: number | null; medianLikes: number | null; medianComments: number | null;
  estimatedEngagementRate: number | null; averageReelViews: number | null; analyzedPosts: number;
  reelsCount: number; imagesCount: number; carouselsCount: number; postsLast7Days: number; postsLast30Days: number;
  averageIntervalDays: number | null; followersFollowingRatio: number | null; mostUsedFormat: string | null;
  bestObservedFormat: string | null; engagementLabel: string; consistencyLabel: string; contentLabel: string;
};
export type AnalysisObservation = { id: string; title: string; message: string; tone: "positive" | "attention" | "neutral" };
export type AnalysisViewModel = {
  requestId: string; state: AnalysisState; stage: AnalysisStage; username: string; profileUrl: string; requestedAt: string;
  analyzedAt: string | null; profile: InstagramProfile | null; posts: InstagramPost[]; metrics: AnalysisMetrics | null;
  observations: AnalysisObservation[]; topPosts: InstagramPost[]; isCached: boolean; statusMessage: string;
  aiSummary?: string; bioAnalysis?: string; contentIdeas?: string[]; recommendedActions?: string[]; captionSuggestions?: string[];
};
