import type { InstagramPost } from "@/lib/social-providers/contracts/instagram-post";
import { confidence, known, median, percentageChange, postInteractions } from "./common";
import type { MetricContext, RecentTrendResult, TrendComparison } from "./types";

function groupMetrics(posts: InstagramPost[], followers: number | null) {
  const likes = known(posts.map((post) => post.likeCount));
  const comments = known(posts.map((post) => post.commentCount));
  const interactions = known(posts.map((post) => postInteractions(post.likeCount, post.commentCount)));
  const views = known(posts.filter((post) => post.mediaType === "video").map((post) => post.playCount ?? post.viewCount));
  const timestamps = posts.flatMap((post) => post.publishedAt ? [new Date(post.publishedAt).getTime()] : []);
  const observedWeeks = timestamps.length > 1 ? Math.max(1, (Math.max(...timestamps) - Math.min(...timestamps)) / (7 * 86_400_000)) : null;
  return { likes: median(likes), comments: median(comments), engagement: followers && followers > 0 ? (median(interactions) ?? 0) / followers * 100 : null, reel_views: median(views), frequency: observedWeeks === null ? null : posts.length / observedWeeks };
}

export function calculateRecentTrend(posts: InstagramPost[], context: MetricContext): RecentTrendResult {
  const chronological = posts.filter((post) => post.publishedAt && !Number.isNaN(new Date(post.publishedAt).getTime())).sort((a, b) => new Date(a.publishedAt!).getTime() - new Date(b.publishedAt!).getTime());
  const size = Math.floor(chronological.length / 2); if (chronological.length < context.config.minimumPostsForTrend || size < 2) return { available: false, explanationCode: "minimum_posts_for_trend", confidence: confidence(chronological.length, context.config.minimumPostsForTrend, context.config.minimumPostsForTrend * 2, !chronological.length), classification: "insufficient", magnitude: "unavailable", comparisons: [], olderGroupSize: size, recentGroupSize: size };
  const older = groupMetrics(chronological.slice(0, size), context.followersCount); const recent = groupMetrics(chronological.slice(-size), context.followersCount);
  const comparisons = (Object.keys(older) as Array<keyof typeof older>).map((metric) => ({ metric, older: older[metric], recent: recent[metric], changePercent: percentageChange(older[metric], recent[metric]) })) as TrendComparison[];
  const primary = comparisons.find((item) => item.metric === "engagement" && item.changePercent !== null) ?? comparisons.find((item) => item.metric === "likes" && item.changePercent !== null) ?? comparisons.find((item) => item.changePercent !== null); const change = primary?.changePercent ?? null; const absolute = Math.abs(change ?? 0);
  return { available: change !== null, explanationCode: change === null ? "no_comparable_metrics" : "equal_chronological_groups", confidence: confidence(chronological.length, context.config.minimumPostsForTrend, context.config.minimumPostsForTrend * 2, change === null), classification: change === null ? "insufficient" : absolute < context.config.trendStableThresholdPercent ? "stable" : change > 0 ? "improving" : "apparent_decline", magnitude: change === null ? "unavailable" : absolute < context.config.trendStableThresholdPercent ? "stable" : absolute >= context.config.trendRelevantThresholdPercent ? "relevant" : "moderate", comparisons, olderGroupSize: size, recentGroupSize: size };
}
