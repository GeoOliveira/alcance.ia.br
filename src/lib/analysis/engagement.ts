import type { InstagramPost } from "@/lib/social-providers/contracts/instagram-post";

export const ENGAGEMENT_FORMULA_VERSION = "engagement-v2";

export type EngagementConfidence = "insufficient" | "low" | "medium" | "high";
export type EngagementClassification = "Dados insuficientes" | "Baixo" | "Moderado" | "Bom" | "Alto";
export type EngagementExclusionReason = "missing_date" | "outside_time_window" | "over_post_limit" | "missing_likes" | "missing_comments";

export type EngagementConfig = {
  maxPosts: number;
  maxAgeDays: number;
  minimumPosts: number;
};

export const DEFAULT_ENGAGEMENT_CONFIG: EngagementConfig = {
  maxPosts: 20,
  maxAgeDays: 90,
  minimumPosts: 3,
};

export const ENGAGEMENT_THRESHOLDS = {
  moderate: 1,
  good: 3,
  high: 6,
} as const;

export function classifyEngagement(rate: number | null, sampleSize: number, minimumPosts = DEFAULT_ENGAGEMENT_CONFIG.minimumPosts): EngagementClassification {
  if (rate === null || sampleSize < minimumPosts) return "Dados insuficientes";
  if (rate < ENGAGEMENT_THRESHOLDS.moderate) return "Baixo";
  if (rate < ENGAGEMENT_THRESHOLDS.good) return "Moderado";
  if (rate < ENGAGEMENT_THRESHOLDS.high) return "Bom";
  return "Alto";
}

export function engagementConfidence(sampleSize: number, minimumPosts = DEFAULT_ENGAGEMENT_CONFIG.minimumPosts): EngagementConfidence {
  if (sampleSize < minimumPosts) return "insufficient";
  if (sampleSize <= 5) return "low";
  if (sampleSize <= 11) return "medium";
  return "high";
}

const validDate = (value: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export function selectEngagementPosts(posts: InstagramPost[], now = new Date(), config: EngagementConfig = DEFAULT_ENGAGEMENT_CONFIG) {
  const exclusions: Record<EngagementExclusionReason, number> = {
    missing_date: 0,
    outside_time_window: 0,
    over_post_limit: 0,
    missing_likes: 0,
    missing_comments: 0,
  };
  const cutoff = now.getTime() - config.maxAgeDays * 86_400_000;
  const dated = posts.flatMap((post) => {
    const date = validDate(post.publishedAt);
    if (!date) { exclusions.missing_date += 1; return []; }
    if (date.getTime() < cutoff || date.getTime() > now.getTime()) { exclusions.outside_time_window += 1; return []; }
    return [{ post, date }];
  }).sort((a, b) => b.date.getTime() - a.date.getTime());
  if (dated.length > config.maxPosts) exclusions.over_post_limit = dated.length - config.maxPosts;
  const windowPosts = dated.slice(0, config.maxPosts).map(({ post }) => post);
  const validPosts = windowPosts.filter((post) => {
    let valid = true;
    if (post.likeCount === null) { exclusions.missing_likes += 1; valid = false; }
    if (post.commentCount === null) { exclusions.missing_comments += 1; valid = false; }
    return valid;
  });
  return { windowPosts, validPosts, exclusions };
}
