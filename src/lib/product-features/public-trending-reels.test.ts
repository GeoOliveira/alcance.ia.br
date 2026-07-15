import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { decideTrendingReelsResourceAccess, filterAndSortTrendingReels, normalizeTrendingReelsSnapshot, type PublicTrendingReel, type TrendingReelsResourceConfig } from "./public-trending-reels";

const category = { id: "1", slug: "marketing", name: "Marketing", language: "pt-BR", country: "BR" };
const config: TrendingReelsResourceConfig = { enabled: true, flagEnabled: true, audience: "public", status: "active", visibility: "full", maxItems: 48, dailyRequests: 0, cacheMinutes: 180, automaticRefresh: false, indexable: true };

describe("normalizeTrendingReelsSnapshot", () => {
  it("normaliza métricas, áudio, localização e indicadores derivados", () => {
    const items = normalizeTrendingReelsSnapshot({ reels: [{ id: "r1", url: "https://www.instagram.com/reel/abc/", thumbnail_url: "https://example.com/cover.jpg", username: "alcance", caption: "Legenda", play_count: 120000, like_count: 6000, comment_count: 300, followers_count: 30000, taken_at: "2026-07-14T10:00:00Z", music_title: "Som original" }] }, category, "2026-07-15T10:00:00Z");
    expect(items[0]).toMatchObject({ author: "@alcance", views: 120000, likes: 6000, comments: 300, audio: "Som original", category: "Marketing", language: "pt-BR", country: "BR", engagementRate: 0.0525, relativePerformance: 4 });
  });

  it("descarta itens sem link HTTPS público", () => {
    expect(normalizeTrendingReelsSnapshot({ items: [{ id: "1" }, { url: "javascript:alert(1)" }] }, null, "2026-07-15T10:00:00Z")).toEqual([]);
  });
});

describe("filterAndSortTrendingReels", () => {
  const base = (overrides: Partial<PublicTrendingReel>): PublicTrendingReel => ({ id: "1", thumbnailUrl: null, author: "@autor", caption: "Teste", views: 100, likes: 10, comments: 1, publishedAt: "2026-07-14T10:00:00Z", audio: "Original", category: "Marketing", categorySlug: "marketing", language: "pt-BR", country: "BR", permalink: "https://instagram.com/reel/1", engagementRate: .11, relativePerformance: 2, observedAt: "2026-07-15T10:00:00Z", ...overrides });
  const items = [base({ id: "1" }), base({ id: "2", views: 1000, likes: 20, engagementRate: .02, relativePerformance: 1, permalink: "https://instagram.com/reel/2" }), base({ id: "3", categorySlug: "moda", publishedAt: "2026-05-01T10:00:00Z", permalink: "https://instagram.com/reel/3" })];

  it("combina filtros e ordena por engajamento", () => {
    expect(filterAndSortTrendingReels(items, { period: "30", category: "marketing", country: "BR", minimumViews: 50, sort: "engagement" }, 20, new Date("2026-07-15T10:00:00Z")).map((item) => item.id)).toEqual(["1", "2"]);
  });

  it("respeita período, limite e ordenação proporcional", () => {
    expect(filterAndSortTrendingReels(items, { period: "all", sort: "relative_performance" }, 1, new Date("2026-07-15T10:00:00Z"))).toHaveLength(1);
    expect(filterAndSortTrendingReels(items, { period: "30" }, 20, new Date("2026-07-15T10:00:00Z")).some((item) => item.id === "3")).toBe(false);
  });
});

describe("trending Reels access and wiring", () => {
  it("libera acesso público e entrega Premium Preview", () => {
    expect(decideTrendingReelsResourceAccess(config)).toMatchObject({ available: true, locked: false });
    expect(decideTrendingReelsResourceAccess({ ...config, audience: "premium" })).toMatchObject({ available: true, locked: true, reason: "premium_required" });
  });

  it("registra catálogo, flag, auditoria e aviso de amostra pública", () => {
    const migration = readFileSync("supabase/migrations/202607150014_public_trending_reels_resource.sql", "utf8");
    const page = readFileSync("src/app/recursos/reels-em-alta/page.tsx", "utf8");
    const actions = readFileSync("src/app/admin/(protected)/recursos/actions.ts", "utf8");
    expect(migration.match(/resource_trending_reels/g)?.length).toBeGreaterThanOrEqual(2);
    expect(page).toContain("amostra pública");
    expect(page).toContain("PREMIUM PREVIEW");
    expect(actions).toContain("product_feature_updated");
  });
});
