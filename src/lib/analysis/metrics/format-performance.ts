import type { InstagramPost } from "@/lib/social-providers/contracts/instagram-post";
import { average, coefficientOfVariation, confidence, known, median, postInteractions } from "./common";
import { postFormat, type ContentFormat, type FormatPerformanceResult, type MetricContext } from "./types";

const formats: ContentFormat[] = ["reel", "image", "carousel", "unknown"];
export function calculateFormatPerformance(posts: InstagramPost[], context: MetricContext): FormatPerformanceResult[] {
  return formats.map((format) => { const group = posts.filter((post) => postFormat(post) === format); const likes = known(group.map((post) => post.likeCount)); const comments = known(group.map((post) => post.commentCount)); const views = format === "reel" ? known(group.map((post) => post.playCount ?? post.viewCount)) : [];
    const interactions = known(group.map((post) => postInteractions(post.likeCount, post.commentCount))); const best = [...group].sort((a, b) => (postInteractions(b.likeCount, b.commentCount) ?? -1) - (postInteractions(a.likeCount, a.commentCount) ?? -1))[0]; const enough = group.length >= context.config.minimumPostsPerFormat;
    return { format, available: enough, explanationCode: enough ? "minimum_sample_reached" : "minimum_posts_per_format", confidence: confidence(group.length, context.config.minimumPostsPerFormat, context.config.minimumPostsPerFormat * 3, !group.length), postsCount: group.length,
      averageLikes: enough ? average(likes) : null, medianLikes: enough ? median(likes) : null, averageComments: enough ? average(comments) : null, medianComments: enough ? median(comments) : null,
      averageViews: enough && format === "reel" ? average(views) : null, medianViews: enough && format === "reel" ? median(views) : null,
      averageEngagementRate: enough && context.followersCount && context.followersCount > 0 ? (average(interactions) ?? 0) / context.followersCount * 100 : null,
      bestPostId: enough ? best?.providerPostId ?? best?.shortcode ?? null : null, variability: enough ? coefficientOfVariation(interactions) : null };
  });
}
