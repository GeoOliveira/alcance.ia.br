import type { InstagramPost } from "@/lib/social-providers/contracts/instagram-post";
import type { FeatureAccessDecision } from "./access";
import type { ProductFeatureKey } from "./catalog";

export type RankedReel = {
  post: InstagramPost;
  views: number;
  interactions: number | null;
  engagementRate: number | null;
  relativePerformance: number | null;
};

export type ProfileProductInsights = {
  access: Partial<Record<ProductFeatureKey, Pick<FeatureAccessDecision, "visible" | "allowed" | "preview" | "reason">>>;
  hashtags: { totalUses: number; unique: number; repeated: number; averagePerPost: number | null; medianPerPost: number | null; postsWithoutHashtags: number; topFiveConcentration: number | null; top: Array<{ hashtag: string; count: number }>; performance: Array<{ hashtag: string; posts: number; averageInteractions: number | null; medianLikes: number | null; medianComments: number | null; medianInteractions: number | null; medianViews: number | null; medianRelativePerformance: number | null }> };
  reels: { total: number; byViews: RankedReel[]; byEngagement: RankedReel[]; byRelativePerformance: RankedReel[]; byInteractions: RankedReel[]; excluded: { missingViews: number; missingInteractions: number; missingFollowers: number } };
  audio: { availableReels: number; missingReels: number; top: Array<{ label: string; count: number; averageViews: number | null; averageInteractions: number | null; bestReel: InstagramPost | null }> };
};

const finiteNonNegative = (value: number | null) => typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
const median = (values: number[]) => { if (!values.length) return null; const sorted = [...values].sort((a, b) => a - b); const middle = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2; };

export function buildProfileProductInsights(
  posts: InstagramPost[],
  followersCount: number | null,
  decisions: Partial<Record<ProductFeatureKey, FeatureAccessDecision>> = {},
): ProfileProductInsights {
  const hashtagCounts = new Map<string, number>();
  const hashtagPosts = new Map<string, InstagramPost[]>();
  const hashtagsPerPost: number[] = [];
  let totalUses = 0;
  let postsWithoutHashtags = 0;
  for (const post of posts) {
    const tags = [...new Set(post.hashtags.map((tag) => tag.trim().toLocaleLowerCase("pt-BR").replace(/^#/, "")).filter(Boolean))];
    hashtagsPerPost.push(tags.length);
    if (!tags.length) postsWithoutHashtags += 1;
    for (const tag of tags) { hashtagCounts.set(tag, (hashtagCounts.get(tag) ?? 0) + 1); hashtagPosts.set(tag, [...(hashtagPosts.get(tag) ?? []), post]); totalUses += 1; }
  }

  const reels = posts.filter((post) => post.mediaType === "video");
  const followers = finiteNonNegative(followersCount) && followersCount! > 0 ? followersCount! : null;
  const ranked = reels.map((post): RankedReel => {
    const views = finiteNonNegative(post.playCount ?? post.viewCount) ?? 0;
    const likes = finiteNonNegative(post.likeCount);
    const comments = finiteNonNegative(post.commentCount);
    const interactions = likes !== null && comments !== null ? likes + comments : null;
    return { post, views, interactions, engagementRate: views > 0 && interactions !== null ? interactions / views * 100 : null, relativePerformance: views > 0 && followers ? views / followers * 100 : null };
  });
  const audioGroups = new Map<string, InstagramPost[]>();
  for (const reel of reels) {
    const label = [reel.audio?.title, reel.audio?.artist].filter(Boolean).join(" — ");
    if (label) audioGroups.set(label, [...(audioGroups.get(label) ?? []), reel]);
  }
  const limit = (key: ProductFeatureKey) => Math.max(1, Math.min(10, decisions[key]?.feature.limits.maxItems ?? 5));
  const safeAccess = Object.fromEntries(Object.entries(decisions).map(([key, value]) => [key, value && { visible: value.visible, allowed: value.allowed, preview: value.preview, reason: value.reason }])) as ProfileProductInsights["access"];
  return {
    access: safeAccess,
    hashtags: {
      totalUses,
      unique: hashtagCounts.size,
      repeated: [...hashtagCounts.values()].filter((count) => count > 1).length,
      averagePerPost: posts.length ? totalUses / posts.length : null,
      medianPerPost: median(hashtagsPerPost),
      postsWithoutHashtags,
      topFiveConcentration: totalUses ? [...hashtagCounts.values()].sort((a, b) => b - a).slice(0, 5).reduce((sum, count) => sum + count, 0) / totalUses * 100 : null,
      top: [...hashtagCounts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit("profile_top_hashtags")).map(([hashtag, count]) => ({ hashtag, count })),
      performance: [...hashtagPosts].filter(([, taggedPosts]) => taggedPosts.length >= (decisions.profile_top_hashtags?.feature.limits.minimumPostsPerHashtag ?? 2)).map(([hashtag, taggedPosts]) => {
        const likes = taggedPosts.flatMap((post) => finiteNonNegative(post.likeCount) ?? []);
        const comments = taggedPosts.flatMap((post) => finiteNonNegative(post.commentCount) ?? []);
        const interactions = taggedPosts.flatMap((post) => post.likeCount !== null && post.commentCount !== null ? [post.likeCount + post.commentCount] : []);
        const views = taggedPosts.flatMap((post) => finiteNonNegative(post.playCount ?? post.viewCount) ?? []);
        const relative = followers ? views.map((value) => value / followers * 100) : [];
        return { hashtag, posts: taggedPosts.length, averageInteractions: average(interactions), medianLikes: median(likes), medianComments: median(comments), medianInteractions: median(interactions), medianViews: median(views), medianRelativePerformance: median(relative) };
      }).sort((a, b) => (b.medianInteractions ?? -1) - (a.medianInteractions ?? -1)).slice(0, limit("profile_top_hashtags")),
    },
    reels: {
      total: reels.length,
      byViews: ranked.filter((item) => item.views > 0).sort((a, b) => b.views - a.views).slice(0, limit("profile_reels_by_views")),
      byEngagement: ranked.filter((item) => item.engagementRate !== null).sort((a, b) => b.engagementRate! - a.engagementRate!).slice(0, limit("profile_reels_by_engagement")),
      byRelativePerformance: ranked.filter((item) => item.relativePerformance !== null).sort((a, b) => b.relativePerformance! - a.relativePerformance!).slice(0, limit("profile_reels_relative_performance")),
      byInteractions: ranked.filter((item) => item.interactions !== null).sort((a, b) => b.interactions! - a.interactions!).slice(0, limit("profile_top_reels")),
      excluded: { missingViews: ranked.filter((item) => item.views <= 0).length, missingInteractions: ranked.filter((item) => item.interactions === null).length, missingFollowers: followers ? 0 : reels.length },
    },
    audio: { availableReels: [...audioGroups.values()].reduce((sum, group) => sum + group.length, 0), missingReels: reels.filter((reel) => !reel.audio?.title && !reel.audio?.artist).length, top: [...audioGroups].sort((a, b) => b[1].length - a[1].length).slice(0, limit("profile_audio_analysis")).map(([label, group]) => { const views = group.flatMap((post) => finiteNonNegative(post.playCount ?? post.viewCount) ?? []); const interactions = group.flatMap((post) => post.likeCount !== null && post.commentCount !== null ? [post.likeCount + post.commentCount] : []); const bestReel = [...group].sort((a, b) => (b.playCount ?? b.viewCount ?? -1) - (a.playCount ?? a.viewCount ?? -1))[0] ?? null; return { label, count: group.length, averageViews: average(views), averageInteractions: average(interactions), bestReel }; }) },
  };
}
