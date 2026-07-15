import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const updateEq = vi.fn();
const update = vi.fn(() => ({ eq: updateEq }));
const maybeSingle = vi.fn();
const selectEq = vi.fn(() => ({ maybeSingle }));
const select = vi.fn(() => ({ eq: selectEq }));
const from = vi.fn(() => ({ select, update }));

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ from }) }));
vi.mock("./advanced-config", () => ({
  getAdvancedAnalysisRuntimeConfig: async () => ({
    config: { minimumPostsForTrend: 6, minimumPostsPerFormat: 3, minimumPostsForCaptionComparison: 3, trendStableThresholdPercent: 10, trendRelevantThresholdPercent: 25, maximumActionItems: 3 },
    engagementConfig: { maxPosts: 20, maxAgeDays: 90, minimumPosts: 3 },
    flags: { profileCompleteness: false, contentFormat: false, engagementStability: false, recentTrend: false, captionAnalysis: false, ctaAnalysis: false, hashtagAnalysis: false, highlightsAudit: false, deterministicActionPlan: false },
  }),
}));

import { recalculateAnalysisMetrics } from "./recalculate-analysis";

describe("recalculateAnalysisMetrics", () => {
  afterEach(() => vi.unstubAllGlobals());
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "info").mockImplementation(() => undefined);
    updateEq.mockResolvedValue({ error: null });
    maybeSingle.mockResolvedValue({ data: {
      profile_data: { provider: "scrapecreators", providerUserId: "1", username: "test", displayName: "Test", biography: null, profileImageUrl: null, externalUrl: null, followersCount: 100, followingCount: 10, postsCount: 1, isPrivate: false, isVerified: false, isBusiness: false, category: null, rawDataAvailable: true, fetchedAt: "2026-07-15T00:00:00.000Z" },
      posts_data: [{ providerPostId: "1", shortcode: "1", permalink: null, mediaType: "image", caption: null, publishedAt: "2026-07-14T00:00:00.000Z", likeCount: 10, commentCount: 1, viewCount: null, playCount: null, durationSeconds: null, thumbnailUrl: null, mediaUrl: null, isPinned: false, isCarousel: false, carouselItemsCount: null, hashtags: [], mentions: [], location: null, audio: null, rawDataAvailable: true }],
      metrics: { estimatedEngagementRate: 9 }, metrics_history: [], metrics_version: "v1", engagement_formula_version: "legacy-v1",
    }, error: null });
  });

  it("persists a new snapshot from normalized data without an external call", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const result = await recalculateAnalysisMetrics("0190f4a0-c6a8-7b44-9b54-e263c162c4b1");
    expect(result.ok).toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ metrics_version: "v2.0.0", calculation_status: "unavailable", metrics_history: expect.arrayContaining([expect.objectContaining({ formulaVersion: "legacy-v1" })]) }));
  });

  it("rejects invalid IDs before reading the database", async () => {
    expect(await recalculateAnalysisMetrics("invalid")).toEqual({ ok: false, code: "invalid_id" });
    expect(from).not.toHaveBeenCalled();
  });
});
