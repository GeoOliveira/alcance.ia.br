import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { calculateAnalysisMetrics, buildObservations, selectTopPosts } from "./analysis-metrics";
import { formatCompactNumber, formatPercentage } from "./analysis-formatters";
import { buildAnalysisViewModel } from "./analysis-view-model";
import type { InstagramPost } from "@/lib/social-providers/contracts/instagram-post";
import type { InstagramProfile } from "@/lib/social-providers/contracts/instagram-profile";

const profile: InstagramProfile = { provider: "scrapecreators", providerUserId: "1", username: "perfil.teste", displayName: "Perfil Teste", biography: "Conteúdo público", profileImageUrl: null, externalUrl: null, followersCount: 1000, followingCount: 100, postsCount: 20, isPrivate: false, isVerified: false, isBusiness: false, category: null, rawDataAvailable: true, fetchedAt: "2026-07-14T12:00:00.000Z" };
function post(id: string, days: number, likes: number | null, comments: number | null, mediaType: InstagramPost["mediaType"] = "image"): InstagramPost { return { providerPostId: id, shortcode: id, permalink: `https://www.instagram.com/p/${id}/`, mediaType, caption: "Legenda", publishedAt: new Date(Date.UTC(2026, 6, 14 - days)).toISOString(), likeCount: likes, commentCount: comments, viewCount: null, playCount: mediaType === "video" ? 1000 : null, durationSeconds: null, thumbnailUrl: null, mediaUrl: null, isPinned: null, isCarousel: mediaType === "carousel", carouselItemsCount: null, hashtags: [], mentions: [], location: null, audio: null, rawDataAvailable: true }; }
const posts = [post("a", 1, 100, 10, "video"), post("b", 4, 60, 4, "image"), post("c", 10, 80, 8, "carousel")];

describe("analysis metrics and view model", () => {
  it("calculates deterministic averages, medians and engagement", () => { const metrics = calculateAnalysisMetrics(profile, posts, new Date("2026-07-14T12:00:00Z")); expect(metrics.averageLikes).toBe(80); expect(metrics.medianLikes).toBe(80); expect(metrics.averageComments).toBeCloseTo(7.333); expect(metrics.estimatedEngagementRate).toBeCloseTo(8.733); expect(metrics.postsLast7Days).toBe(2); expect(metrics.reelsCount).toBe(1); });
  it("keeps unavailable metrics null instead of zero", () => { const metrics = calculateAnalysisMetrics({ ...profile, followersCount: null }, [post("x", 1, null, null)]); expect(metrics.averageLikes).toBeNull(); expect(metrics.estimatedEngagementRate).toBeNull(); expect(metrics.averageIntervalDays).toBeNull(); });
  it("selects the strongest posts by known interactions", () => expect(selectTopPosts(posts)[0]?.providerPostId).toBe("a"));
  it("creates clear observations for few data and missing bio", () => { const metrics = calculateAnalysisMetrics({ ...profile, biography: null }, posts.slice(0, 1)); const observations = buildObservations({ ...profile, biography: null }, posts.slice(0, 1), metrics); expect(observations.map((item) => item.id)).toEqual(expect.arrayContaining(["few-posts", "bio-empty"])); });
  it("maps loading, private, partial, insufficient and completed states", () => { const base = { id: "0190f4a0-c6a8-7b44-9b54-e263c162c4b1", instagram_username: "teste", instagram_profile_url: "https://instagram.com/teste/", created_at: "2026-07-14T12:00:00Z" };
    expect(buildAnalysisViewModel({ ...base, status: "pending", metadata: {} }, null).state).toBe("waiting");
    expect(buildAnalysisViewModel({ ...base, status: "failed", metadata: { analysis_error_code: "private_profile" } }, null).state).toBe("private");
    const result = { data_quality: "partial", profile_data: profile, posts_data: posts, metrics: calculateAnalysisMetrics(profile, posts), observations: [], fetched_at: "2026-07-14T12:00:00Z", source_metadata: {} };
    expect(buildAnalysisViewModel({ ...base, status: "completed", metadata: {} }, result).state).toBe("partial");
    expect(buildAnalysisViewModel({ ...base, status: "completed", metadata: {} }, { ...result, data_quality: "insufficient" }).state).toBe("insufficient_data");
    expect(buildAnalysisViewModel({ ...base, status: "completed", metadata: {} }, { ...result, data_quality: "complete" }).state).toBe("completed");
  });
  it("formats absent values without inventing data", () => { expect(formatCompactNumber(null)).toBe("Não disponível"); expect(formatPercentage(null)).toBe("Dados insuficientes"); });
  it("keeps individual analysis pages noindex", () => { const source = readFileSync("src/app/analisar/[requestId]/page.tsx", "utf8"); expect(source).toContain("index: false"); expect(source).toContain("nocache: true"); });
});
