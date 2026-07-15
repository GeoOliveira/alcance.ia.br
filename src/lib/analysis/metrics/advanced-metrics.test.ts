import { describe, expect, it } from "vitest";
import type { InstagramPost } from "@/lib/social-providers/contracts/instagram-post";
import type { InstagramProfile } from "@/lib/social-providers/contracts/instagram-profile";
import {
  buildActionPlan,
  calculateAdvancedMetrics,
  calculateCaptionAnalysis,
  calculateContentDiversity,
  calculateCtaAnalysis,
  calculateEngagementStability,
  calculateFollowerFollowingRatio,
  calculateFormatPerformance,
  calculateHashtagAnalysis,
  calculatePerformanceConcentration,
  calculateProfileCompleteness,
  calculatePublishingRegularity,
  calculateRecentTrend,
  unavailableHighlightsAudit,
  type AdvancedAnalysisConfig,
  type AdvancedFeatureFlags,
} from ".";

const now = new Date("2026-07-15T12:00:00.000Z");
const profile: InstagramProfile = { provider: "scrapecreators", providerUserId: "1", username: "teste", displayName: "Teste", biography: "Agende seu orçamento", profileImageUrl: "https://example.com/avatar.jpg", externalUrl: null, followersCount: 1_000, followingCount: 100, postsCount: 30, isPrivate: false, isVerified: false, isBusiness: true, category: "Empresa", rawDataAvailable: true, fetchedAt: now.toISOString() };
const config: AdvancedAnalysisConfig = { minimumPostsForTrend: 6, minimumPostsPerFormat: 3, minimumPostsForCaptionComparison: 2, trendStableThresholdPercent: 10, trendRelevantThresholdPercent: 25, maximumActionItems: 3 };
const allFlags: AdvancedFeatureFlags = { profileCompleteness: true, contentFormat: true, engagementStability: true, recentTrend: true, captionAnalysis: true, ctaAnalysis: true, hashtagAnalysis: true, highlightsAudit: true, deterministicActionPlan: true };

function post(id: string, daysAgo: number, likes: number | null, comments: number | null, mediaType: InstagramPost["mediaType"] = "image", caption = "Legenda", hashtags: string[] = []): InstagramPost {
  return { providerPostId: id, shortcode: id, permalink: null, mediaType, caption, publishedAt: new Date(now.getTime() - daysAgo * 86_400_000).toISOString(), likeCount: likes, commentCount: comments, viewCount: mediaType === "video" ? (likes ?? 0) * 10 : null, playCount: null, durationSeconds: null, thumbnailUrl: null, mediaUrl: null, isPinned: false, isCarousel: mediaType === "carousel", carouselItemsCount: null, hashtags, mentions: [], location: null, audio: null, rawDataAvailable: true };
}

const variedPosts = [
  post("a", 35, 20, 2, "image", "Confira o link na bio #marca", ["marca"]),
  post("b", 28, 30, 3, "video", "Comente sua dúvida?", ["dica"]),
  post("c", 21, 40, 4, "carousel", "Legenda\ncom parágrafo", ["marca", "dica"]),
  post("d", 14, 60, 6, "image", "Salve este post", ["marca"]),
  post("e", 7, 90, 9, "video", "Envie para alguém", []),
  post("f", 1, 120, 12, "carousel", "Chame no direct", []),
];

describe("advanced deterministic metrics", () => {
  it("scores completeness with fixed weights and identifies missing fields", () => {
    const complete = calculateProfileCompleteness({ ...profile, externalUrl: "https://example.com" });
    const partial = calculateProfileCompleteness({ ...profile, biography: null, profileImageUrl: null, category: null, postsCount: 0 });
    expect(complete.score).toBe(100);
    expect(complete.classification).toBe("complete");
    expect(partial.score).toBe(25);
    expect(partial.missingCriteria).toEqual(expect.arrayContaining(["profile_image", "biography", "professional_category", "existing_posts"]));
  });

  it("keeps the follower/following ratio descriptive and handles zero", () => {
    expect(calculateFollowerFollowingRatio(profile).ratio).toBe(10);
    const zero = calculateFollowerFollowingRatio({ ...profile, followingCount: 0 });
    expect(zero.available).toBe(false);
    expect(zero.ratio).toBeNull();
  });

  it("classifies format diversity from normalized media types", () => {
    const result = calculateContentDiversity(variedPosts);
    expect(result.counts).toMatchObject({ reel: 2, image: 2, carousel: 2 });
    expect(result.classification).toBe("diverse");
  });

  it("enforces minimum samples and uses medians per format", () => {
    const result = calculateFormatPerformance([...variedPosts, post("g", 2, 150, 15, "image")], { now, followersCount: 1_000, config });
    const images = result.find((item) => item.format === "image")!;
    const reels = result.find((item) => item.format === "reel")!;
    expect(images.available).toBe(true);
    expect(images.medianLikes).toBe(60);
    expect(reels.available).toBe(false);
    expect(reels.medianViews).toBeNull();
  });

  it("detects variability and a strong outlier", () => {
    const stable = calculateEngagementStability([post("1", 4, 100, 0), post("2", 3, 102, 0), post("3", 2, 98, 0), post("4", 1, 101, 0)]);
    const outlier = calculateEngagementStability([1, 2, 3, 4, 5, 100].map((likes, index) => post(String(index), index, likes, 0)));
    expect(stable.classification).toBe("stable");
    expect(outlier.classification).toBe("highly_variable");
    expect(outlier.outliersCount).toBe(1);
  });

  it("calculates interaction concentration without Reel views", () => {
    const result = calculatePerformanceConcentration([post("1", 4, 70, 0, "video"), post("2", 3, 10, 0), post("3", 2, 10, 0), post("4", 1, 10, 0)]);
    expect(result.topPostPercent).toBe(70);
    expect(result.topThreePercent).toBe(90);
    expect(result.classification).toBe("highly_concentrated");
  });

  it("compares equal chronological groups and rejects a short sample", () => {
    const trend = calculateRecentTrend(variedPosts, { now, followersCount: 1_000, config });
    const short = calculateRecentTrend(variedPosts.slice(0, 3), { now, followersCount: 1_000, config });
    expect(trend.classification).toBe("improving");
    expect(trend.comparisons.find((item) => item.metric === "likes")?.changePercent).toBeGreaterThan(100);
    expect(short.available).toBe(false);
    expect(short.explanationCode).toBe("minimum_posts_for_trend");
  });

  it("measures regularity over the observed 90-day window", () => {
    const result = calculatePublishingRegularity(variedPosts, now);
    expect(result.postsLast7Days).toBe(2);
    expect(result.postsLast30Days).toBe(5);
    expect(result.last7ShareOf30Percent).toBe(40);
    expect(result.activeWeeks).toBeGreaterThan(0);
  });

  it("describes captions including empty captions", () => {
    const result = calculateCaptionAnalysis([post("1", 1, 1, 1, "image", ""), post("2", 2, 1, 1, "image", "Uma pergunta? 😊")]);
    expect(result.emptyCaptions).toBe(1);
    expect(result.withQuestionsPercent).toBe(100);
    expect(result.withEmojisPercent).toBe(100);
  });

  it("detects explicit CTAs and avoids common false positives", () => {
    const result = calculateCtaAnalysis([post("1", 1, 1, 1, "image", "Comente abaixo"), post("2", 2, 1, 1, "image", "Eu comentei ontem"), post("3", 3, 1, 1, "image", "Salve, pessoal")]);
    expect(result.postsWithCta).toBe(1);
    expect(result.mostFrequent).toContain("comente");
  });

  it("summarizes hashtags and only compares interactions with enough samples", () => {
    const result = calculateHashtagAnalysis(variedPosts, 2);
    expect(result.uniqueHashtags).toBe(2);
    expect(result.mostUsed[0]).toEqual({ hashtag: "marca", count: 3 });
    expect(result.withHashtagsAverageInteractions).not.toBeNull();
    expect(result.withoutHashtagsAverageInteractions).not.toBeNull();
  });

  it("reports highlights unavailable without fabricating a collection", () => {
    const result = unavailableHighlightsAudit();
    expect(result.available).toBe(false);
    expect(result.explanationCode).toBe("highlights_not_collected");
    expect(result.count).toBeNull();
  });

  it("prioritizes evidence-backed actions and avoids category contradictions", () => {
    const metrics = calculateAdvancedMetrics({ ...profile, profileImageUrl: null, displayName: null, category: null, postsCount: 0 }, variedPosts, config, allFlags, now);
    const actions = buildActionPlan(profile, { ...metrics, actionPlan: undefined }, 5);
    expect(actions.length).toBeLessThanOrEqual(5);
    expect(actions[0]?.priority).toBe("high");
    expect(new Set(actions.map((item) => item.category)).size).toBe(actions.length);
    expect(actions.every((item) => item.evidence && item.sourceMetrics.length)).toBe(true);
  });

  it("returns discrete confidence levels based on sample size", () => {
    expect(calculateEngagementStability([]).confidence.level).toBe("unavailable");
    expect(calculateEngagementStability(variedPosts.slice(0, 4)).confidence.level).toBe("medium");
  });

  it("prevents disabled feature flags from calculating or exposing modules", () => {
    const disabled = Object.fromEntries(Object.keys(allFlags).map((key) => [key, false])) as AdvancedFeatureFlags;
    const result = calculateAdvancedMetrics(profile, variedPosts, config, disabled, now);
    expect(result.profileCompleteness).toBeUndefined();
    expect(result.actionPlan).toBeUndefined();
    expect(result.methodology.enabledModules).toEqual([]);
  });

  it("integrates complete, partial, new and large profile inputs without throwing", () => {
    const partialPosts = [post("null", 1, null, null, "image", "", [])];
    expect(() => calculateAdvancedMetrics({ ...profile, followersCount: null, followingCount: null }, partialPosts, config, allFlags, now)).not.toThrow();
    expect(calculateAdvancedMetrics({ ...profile, followersCount: 50_000_000, followingCount: 1 }, variedPosts, config, allFlags, now).followerFollowingRatio?.ratio).toBe(50_000_000);
  });
});
