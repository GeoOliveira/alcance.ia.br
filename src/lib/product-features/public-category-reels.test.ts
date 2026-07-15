import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { decideCategoryReelsAccess, filterCategoryReels, type CategoryReel, type CategoryReelsConfig } from "./public-category-reels";

const config: CategoryReelsConfig = { enabled: true, flagEnabled: true, audience: "public", status: "active", visibility: "full", maxItems: 60, cacheMinutes: 180, automaticRefresh: false, indexable: true, enabledCountries: ["BR"], enabledLanguages: ["pt-BR"] };
const item = (overrides: Partial<CategoryReel> = {}): CategoryReel => ({ id: "1", thumbnailUrl: null, author: "@autor", caption: "Tutorial de marketing #conteudo", views: 100_000, likes: 5_000, comments: 100, publishedAt: "2026-07-14T12:00:00.000Z", audio: "Áudio original", category: "Marketing", categorySlug: "marketing", language: "pt-BR", country: "BR", permalink: "https://www.instagram.com/reel/abc/", engagementRate: 0.051, relativePerformance: 2, observedAt: "2026-07-14T13:00:00.000Z", hashtags: ["#conteudo"], format: "tutorial", ...overrides });

describe("Reels por categoria", () => {
  it("respeita flag, disponibilidade e audiência", () => {
    expect(decideCategoryReelsAccess(config)).toMatchObject({ available: true, locked: false });
    expect(decideCategoryReelsAccess({ ...config, flagEnabled: false })).toMatchObject({ available: false });
    expect(decideCategoryReelsAccess({ ...config, audience: "premium" })).toMatchObject({ available: true, locked: true, reason: "premium_required" });
  });

  it("filtra pesquisa, categoria, formato, país e mínimo de views", () => {
    const items = [item(), item({ id: "2", category: "Moda", categorySlug: "moda", format: "vlog", views: 2_000, caption: "Look do dia" })];
    expect(filterCategoryReels(items, { query: "conteudo", category: "marketing", format: "tutorial", country: "BR", minimumViews: 50_000, period: "30" }, 60, new Date("2026-07-15T12:00:00.000Z"))).toHaveLength(1);
  });

  it("declara feature flag e todas as categorias iniciais na migration", () => {
    const migration = readFileSync("supabase/migrations/202607150015_public_reels_by_category.sql", "utf8");
    expect(migration).toContain("resource_reels_by_category");
    for (const slug of ["marketing", "negocios", "tecnologia", "financas", "fitness", "saude", "gastronomia", "moda", "beleza", "educacao", "pets", "musica", "turismo", "entretenimento"]) expect(migration).toContain(`('${slug}'`);
  });
});
