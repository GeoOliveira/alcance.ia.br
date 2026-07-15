import type { InstagramPost } from "@/lib/social-providers/contracts/instagram-post";
import { confidence, known, percent, postInteractions } from "./common";
import type { PerformanceConcentrationResult } from "./types";

export function calculatePerformanceConcentration(posts: InstagramPost[]): PerformanceConcentrationResult {
  const values = known(posts.map((post) => postInteractions(post.likeCount, post.commentCount))).sort((a, b) => b - a); const total = values.reduce((sum, value) => sum + value, 0);
  if (values.length < 3 || total <= 0) return { available: false, explanationCode: "minimum_three_interaction_values", confidence: confidence(values.length, 3, 10, !values.length), topPostPercent: null, topThreePercent: null, topTwentyPercent: null, classification: "insufficient", totalInteractions: total || null };
  const topThree = percent(values.slice(0, 3).reduce((sum, value) => sum + value, 0), total)!; const topTwentyCount = Math.max(1, Math.ceil(values.length * 0.2));
  return { available: true, explanationCode: "share_of_total_interactions", confidence: confidence(values.length, 3, 10), topPostPercent: percent(values[0]!, total), topThreePercent: topThree, topTwentyPercent: percent(values.slice(0, topTwentyCount).reduce((sum, value) => sum + value, 0), total), classification: topThree >= 70 ? "highly_concentrated" : topThree >= 50 ? "partially_concentrated" : "distributed", totalInteractions: total };
}
