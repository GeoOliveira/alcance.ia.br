import { describe, expect, it } from "vitest";
import type { InstagramPost } from "@/lib/social-providers/contracts/instagram-post";
import type { InstagramProfile } from "@/lib/social-providers/contracts/instagram-profile";
import { calculateAnalysisMetrics } from "./analysis-metrics";
import { deduplicatePosts } from "./deduplicate-posts";
import { classifyEngagement, selectEngagementPosts } from "./engagement";

const now = new Date("2026-07-14T12:00:00.000Z");
const profile: InstagramProfile = { provider: "scrapecreators", providerUserId: "1", username: "teste", displayName: "Teste", biography: null, profileImageUrl: null, externalUrl: null, followersCount: 10_000, followingCount: 10, postsCount: 20, isPrivate: false, isVerified: false, isBusiness: false, category: null, rawDataAvailable: true, fetchedAt: now.toISOString() };
function post(id: string, interactions: number, days = 1, likes: number | null = interactions, comments: number | null = 0, overrides: Partial<InstagramPost> = {}): InstagramPost {
  return { providerPostId: id, shortcode: id, permalink: `https://www.instagram.com/p/${id}/`, mediaType: "image", caption: null, publishedAt: new Date(now.getTime() - days * 86_400_000).toISOString(), likeCount: likes, commentCount: comments, viewCount: null, playCount: null, durationSeconds: null, thumbnailUrl: null, mediaUrl: null, isPinned: false, isCarousel: false, carouselItemsCount: null, hashtags: [], mentions: [], location: null, audio: null, rawDataAvailable: true, ...overrides };
}

describe("engagement-v2", () => {
  it("calculates mean and median engagement from total interactions", () => {
    const metrics = calculateAnalysisMetrics(profile, [post("a", 100), post("b", 200), post("c", 300)], now);
    expect(metrics.averageInteractions).toBe(200); expect(metrics.medianInteractions).toBe(200); expect(metrics.estimatedEngagementRate).toBe(2); expect(metrics.estimatedTypicalEngagementRate).toBe(2); expect(metrics.engagementFormulaVersion).toBe("engagement-v2");
  });
  it("shows the viral-post difference between mean and median", () => {
    const metrics = calculateAnalysisMetrics(profile, [100, 110, 120, 130, 2000].map((value, index) => post(String(index), value)), now);
    expect(metrics.averageInteractions).toBe(492); expect(metrics.medianInteractions).toBe(120); expect(metrics.estimatedEngagementRate).toBe(4.92); expect(metrics.estimatedTypicalEngagementRate).toBe(1.2); expect(metrics.topPostShare).toBeCloseTo(81.3, 1);
  });
  it("does not classify one post and does not divide by zero followers", () => {
    expect(calculateAnalysisMetrics(profile, [post("a", 100)], now).engagementLabel).toBe("Dados insuficientes");
    expect(calculateAnalysisMetrics({ ...profile, followersCount: 0 }, [post("a", 100), post("b", 200), post("c", 300)], now).estimatedEngagementRate).toBeNull();
  });
  it("excludes missing likes but accepts an observed zero comment count", () => {
    const metrics = calculateAnalysisMetrics(profile, [post("missing", 0, 1, null, 2), post("zero", 10, 1, 10, 0)], now);
    expect(metrics.validEngagementPosts).toBe(1); expect(metrics.averageInteractions).toBe(10); expect(metrics.engagementExclusions.missing_likes).toBe(1); expect(metrics.engagementExclusions.missing_comments).toBe(0);
  });
  it("calculates the median correctly for an even sample", () => expect(calculateAnalysisMetrics(profile, [post("a", 100), post("b", 200), post("c", 300), post("d", 400)], now).medianInteractions).toBe(250));
  it("classifies using the raw value at exact boundaries", () => {
    expect(classifyEngagement(0.9999, 3)).toBe("Baixo"); expect(classifyEngagement(1, 3)).toBe("Moderado"); expect(classifyEngagement(3, 3)).toBe("Bom"); expect(classifyEngagement(6, 3)).toBe("Alto");
  });
  it("uses real dates for pinned posts and excludes old pinned content", () => {
    const selection = selectEngagementPosts([post("recent", 10), post("pinned", 1000, 120, 1000, 0, { isPinned: true })], now);
    expect(selection.validPosts.map((item) => item.providerPostId)).toEqual(["recent"]); expect(selection.exclusions.outside_time_window).toBe(1);
  });
  it("deduplicates posts and Reels across endpoint identifiers while merging known fields", () => {
    const feed = post("provider-a", 100, 1, 100, null, { shortcode: "ABC", permalink: "https://instagram.com/p/ABC/?x=1" });
    const reel = post("provider-b", 105, 1, 100, 5, { shortcode: "ABC", permalink: "https://instagram.com/reel/ABC/", mediaType: "video", playCount: 500 });
    const result = deduplicatePosts([feed, reel]); expect(result.posts).toHaveLength(1); expect(result.duplicatesMerged).toBe(1); expect(result.posts[0]?.commentCount).toBe(5); expect(result.posts[0]?.playCount).toBe(500);
  });
  it("matches a shortcode against a normalized permalink when endpoints expose different identifiers", () => {
    const byCode = post("feed-id", 10, 1, 10, 0, { providerPostId: null, shortcode: "XYZ", permalink: null });
    const byLink = post("reel-id", 10, 1, 10, 0, { providerPostId: null, shortcode: null, permalink: "https://www.instagram.com/reel/XYZ/?utm_source=test", mediaType: "video" });
    expect(deduplicatePosts([byCode, byLink]).posts).toHaveLength(1);
  });
  it("limits the sample after sorting by date and reports missing dates", () => {
    const selection = selectEngagementPosts([post("old", 1, 3), post("new", 2, 1), post("middle", 3, 2), post("undated", 4, 1, 4, 0, { publishedAt: null })], now, { maxPosts: 2, maxAgeDays: 90, minimumPosts: 3 });
    expect(selection.windowPosts.map((item) => item.providerPostId)).toEqual(["new", "middle"]); expect(selection.exclusions.over_post_limit).toBe(1); expect(selection.exclusions.missing_date).toBe(1);
  });
});
