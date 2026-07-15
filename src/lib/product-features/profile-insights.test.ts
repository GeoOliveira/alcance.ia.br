import { describe, expect, it } from "vitest";
import type { InstagramPost } from "@/lib/social-providers/contracts/instagram-post";
import { buildProfileProductInsights } from "./profile-insights";

function post(overrides: Partial<InstagramPost>): InstagramPost {
  return { providerPostId: crypto.randomUUID(), shortcode: null, permalink: null, mediaType: "video", caption: null, publishedAt: null, likeCount: null, commentCount: null, viewCount: null, playCount: null, durationSeconds: null, thumbnailUrl: null, mediaUrl: null, isPinned: null, isCarousel: false, carouselItemsCount: null, hashtags: [], mentions: [], location: null, audio: null, rawDataAvailable: false, ...overrides };
}

describe("buildProfileProductInsights", () => {
  it("normaliza hashtags e não conta repetição dentro da mesma publicação", () => {
    const result = buildProfileProductInsights([
      post({ hashtags: ["#Marketing", "marketing", "Conteudo"] }),
      post({ hashtags: ["#marketing"] }),
      post({ hashtags: [] }),
    ], 1000);
    expect(result.hashtags).toMatchObject({ totalUses: 3, unique: 2, postsWithoutHashtags: 1, averagePerPost: 1 });
    expect(result.hashtags.top[0]).toEqual({ hashtag: "marketing", count: 2 });
  });

  it("mantém os três critérios de Reels independentes", () => {
    const highViews = post({ caption: "views", playCount: 10_000, likeCount: 100, commentCount: 0 });
    const highEngagement = post({ caption: "engagement", playCount: 1_000, likeCount: 200, commentCount: 0 });
    const result = buildProfileProductInsights([highViews, highEngagement], 2_000);
    expect(result.reels.byViews[0]?.post.caption).toBe("views");
    expect(result.reels.byEngagement[0]?.post.caption).toBe("engagement");
    expect(result.reels.byRelativePerformance[0]?.post.caption).toBe("views");
  });

  it("exclui denominadores ausentes em vez de convertê-los em zero", () => {
    const result = buildProfileProductInsights([post({ playCount: null, viewCount: null, likeCount: 10, commentCount: 2 })], null);
    expect(result.reels.byViews).toHaveLength(0);
    expect(result.reels.byEngagement).toHaveLength(0);
    expect(result.reels.byRelativePerformance).toHaveLength(0);
    expect(result.reels.excluded).toEqual({ missingViews: 1, missingInteractions: 0, missingFollowers: 1 });
  });

  it("resume apenas áudios realmente disponíveis", () => {
    const result = buildProfileProductInsights([
      post({ audio: { id: "1", title: "Som original", artist: "Criador" } }),
      post({ audio: { id: "1", title: "Som original", artist: "Criador" } }),
      post({ audio: null }),
    ], 500);
    expect(result.audio).toMatchObject({ availableReels: 2, missingReels: 1 });
    expect(result.audio.top[0]).toMatchObject({ label: "Som original — Criador", count: 2 });
  });
});
