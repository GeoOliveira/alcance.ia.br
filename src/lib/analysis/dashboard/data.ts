import type { AnalysisViewModel } from "@/lib/analysis/types";
import type { ContentFormat } from "@/lib/analysis/metrics";

export type DashboardData = {
  profileHealth: Array<{ subject: string; value: number }>;
  recentPosts: Array<{ label: string; engagement: number; interactions: number }>;
  formatDistribution: Array<{ name: string; value: number }>;
  topReels: Array<{ name: string; views: number }>;
  topHashtags: Array<{ name: string; count: number }>;
  formatComparison: Array<{ format: string; likes: number; comments: number; views: number }>;
};

const clamp = (value: number) => Math.max(0, Math.min(100, Math.round(value)));
const formatLabels: Record<ContentFormat, string> = { reel: "Reels", carousel: "Carrosséis", image: "Fotos", unknown: "Outros" };

export function buildDashboardData(analysis: AnalysisViewModel): DashboardData {
  const advanced = analysis.advancedMetrics;
  const posts = analysis.posts;
  const followers = analysis.profile?.followersCount;
  const health = [
    advanced?.profileCompleteness?.score == null ? null : { subject: "Bio", value: clamp(advanced.profileCompleteness.score) },
    analysis.metrics?.estimatedEngagementRate == null ? null : { subject: "Engajamento", value: clamp(analysis.metrics.estimatedEngagementRate / 5 * 100) },
    advanced?.publishingRegularity ? { subject: "Frequência", value: ({ consistent: 100, moderately_consistent: 72, irregular: 42, recently_inactive: 20, insufficient: 0 } as const)[advanced.publishingRegularity.classification] } : null,
    advanced?.contentDiversity ? { subject: "Conteúdo", value: ({ diverse: 100, moderately_diverse: 72, concentrated: 42, insufficient: 0 } as const)[advanced.contentDiversity.classification] } : null,
    advanced?.hashtagAnalysis && posts.length ? { subject: "Hashtags", value: clamp((posts.length - advanced.hashtagAnalysis.postsWithoutHashtags) / posts.length * 100) } : null,
    advanced?.ctaAnalysis?.percentageWithCta == null ? null : { subject: "CTA", value: clamp(advanced.ctaAnalysis.percentageWithCta) },
  ].filter((item): item is { subject: string; value: number } => item !== null && item.value > 0);

  const recentPosts = posts
    .filter((post) => post.publishedAt && post.likeCount !== null && post.commentCount !== null && typeof followers === "number" && followers > 0)
    .sort((a, b) => new Date(a.publishedAt!).getTime() - new Date(b.publishedAt!).getTime())
    .slice(-10)
    .map((post, index) => ({ label: new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(post.publishedAt!)) || `Post ${index + 1}`, interactions: post.likeCount! + post.commentCount!, engagement: Number(((post.likeCount! + post.commentCount!) / followers! * 100).toFixed(2)) }));

  const distribution = advanced?.contentDiversity?.counts;
  const formatDistribution = distribution ? (["reel", "carousel", "image"] as const).map((format) => ({ name: formatLabels[format], value: distribution[format] })).filter((item) => item.value > 0) : [];
  const topReels = (analysis.productInsights?.reels.byViews ?? []).slice(0, 5).map((item, index) => ({ name: item.post.shortcode ? `#${item.post.shortcode.slice(0, 8)}` : `Reel ${index + 1}`, views: item.views }));
  const topHashtags = (analysis.productInsights?.hashtags.top ?? []).slice(0, 8).map((item) => ({ name: `#${item.hashtag}`, count: item.count }));
  const formatComparison = (advanced?.formatPerformance ?? []).filter((item) => item.format !== "unknown" && [item.averageLikes, item.averageComments, item.averageViews].some((value) => value !== null)).map((item) => ({ format: formatLabels[item.format], likes: Math.round(item.averageLikes ?? 0), comments: Math.round(item.averageComments ?? 0), views: Math.round(item.averageViews ?? 0) }));

  return { profileHealth: health, recentPosts, formatDistribution, topReels, topHashtags, formatComparison };
}

