import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { AnalysisViewModel } from "@/lib/analysis/types";
import { buildDashboardData } from "./data";
import { decideDashboardModuleAccess, type DashboardModuleRecord } from "./access";
import { dashboardModuleKeys } from "./catalog";

const baseModule: Omit<DashboardModuleRecord, "preview" | "allowed"> = { key: "profile_health_radar", title: "Saúde", description: "Resumo", icon: "radar", chartType: "radar", enabled: true, visible: true, accessLevel: "public", status: "active", displayOrder: 10, requiresAI: false, requiresAuthentication: false, requiresPremium: false, minimumData: 3, dependencies: [] };

const analysis = {
  posts: [
    { shortcode: "a", mediaType: "video", publishedAt: "2026-07-14T12:00:00Z", likeCount: 100, commentCount: 10 },
    { shortcode: "b", mediaType: "image", publishedAt: "2026-07-15T12:00:00Z", likeCount: 150, commentCount: 20 },
  ],
  profile: { followersCount: 1000 },
  metrics: { estimatedEngagementRate: 3 },
  advancedMetrics: {
    profileCompleteness: { score: 80 }, publishingRegularity: { classification: "consistent" }, contentDiversity: { classification: "moderately_diverse", counts: { reel: 1, image: 1, carousel: 0, unknown: 0 } }, hashtagAnalysis: { postsWithoutHashtags: 1 }, ctaAnalysis: { percentageWithCta: 50 },
    formatPerformance: [{ format: "reel", averageLikes: 100, averageComments: 10, averageViews: 1000 }],
  },
  productInsights: { reels: { byViews: [{ post: { shortcode: "a" }, views: 1000 }] }, hashtags: { top: [{ hashtag: "marketing", count: 2 }] } },
} as unknown as AnalysisViewModel;

describe("executive dashboard", () => {
  it("builds every chart only from the persisted analysis view", () => {
    const data = buildDashboardData(analysis);
    expect(data.profileHealth).toHaveLength(6);
    expect(data.recentPosts.map((item) => item.engagement)).toEqual([11, 17]);
    expect(data.formatDistribution).toEqual([{ name: "Reels", value: 1 }, { name: "Fotos", value: 1 }]);
    expect(data.topReels[0]).toMatchObject({ views: 1000, url: null });
    expect(data.topHashtags[0]?.name).toBe("#marketing");
    expect(data.formatComparison[0]).toMatchObject({ format: "Reels", likes: 100, comments: 10, views: 1000 });
  });

  it("returns an empty recent-post series when followers are unavailable", () => {
    const data = buildDashboardData({ ...analysis, profile: { ...analysis.profile!, followersCount: 0 } });
    expect(data.recentPosts).toEqual([]);
  });

  it("shows premium preview without granting access", () => {
    const premium = { ...baseModule, accessLevel: "premium" as const, requiresPremium: true };
    expect(decideDashboardModuleAccess(premium, {}, true)).toMatchObject({ allowed: false, preview: true });
    expect(decideDashboardModuleAccess(premium, { isPremium: true }, true)).toMatchObject({ allowed: true, preview: false });
  });

  it("ships a persisted, ordered catalog and every requested flag", () => {
    const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/202607150012_executive_dashboard.sql"), "utf8");
    for (const key of dashboardModuleKeys) expect(migration).toContain(`'${key}'`);
    for (const flag of ["dashboard_enabled", "dashboard_radar", "dashboard_posts_chart", "dashboard_formats_chart", "dashboard_top_reels_chart", "dashboard_hashtags_chart", "dashboard_comparison_chart", "dashboard_premium_preview"]) expect(migration).toContain(`'${flag}'`);
    expect(migration).toContain("enable row level security");
    expect(migration).toContain("dashboard_modules_super_admin_update");
  });
});
