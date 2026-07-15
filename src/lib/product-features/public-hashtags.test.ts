import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { decideHashtagResourceAccess, filterPublicHashtags, findPublicHashtagDetail, getMostRecurringHashtags, normalizeHashtagSnapshot, type HashtagResourceConfig, type PublicHashtagItem } from "./public-hashtags";

const category = { id: "category-1", slug: "marketing", name: "Marketing" };
const config: HashtagResourceConfig = { enabled: true, flagEnabled: true, audience: "public", status: "active", visibility: "full", maxItems: 60, cacheMinutes: 360, automaticRefresh: false, indexable: true };

describe("normalizeHashtagSnapshot", () => {
  it("normaliza aliases, tendências, popularidade e hashtags relacionadas", () => {
    const result = normalizeHashtagSnapshot({ hashtags: [
      { tag: "#Marketing-Digital", frequency: 1200, posts_count: 875, growth_rate: "12", related_hashtags: ["#conteudo", "conteudo", "#social-media"], contentIds: ["post-1", "invalid"] },
      { name: "nicho", count: 20, change_percent: "-9" },
    ], contents: { "post-1": { url: "https://www.instagram.com/p/ABC123/", thumbnailUrl: "https://scontent.cdninstagram.com/photo.jpg", caption: "Uma publicação de exemplo", username: "alcance", likes: 12, comments: 3, views: 50 }, invalid: { url: "javascript:alert(1)" } } }, category, "2026-07-15T12:00:00.000Z");

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({ hashtag: "marketingdigital", occurrences: 1200, contentsFound: 875, trend: "alta", popularity: "alta", related: ["conteudo", "socialmedia"], contents: [{ username: "alcance", likes: 12 }] });
    expect(result[1]).toMatchObject({ hashtag: "nicho", trend: "baixa", popularity: "baixa" });
  });

  it("ignora entradas sem hashtag válida", () => {
    expect(normalizeHashtagSnapshot({ items: [{ count: 4 }, null, "tag"] }, category, "2026-07-15T12:00:00.000Z")).toEqual([]);
  });
});

describe("filterPublicHashtags", () => {
  const items: PublicHashtagItem[] = [
    { id: "1", hashtag: "marketing", occurrences: 300, trend: "alta", category: "Marketing", categorySlug: "marketing", contentsFound: 240, updatedAt: "2026-07-14T12:00:00.000Z", popularity: "média", related: ["conteudo"], contents: [] },
    { id: "2", hashtag: "gastronomia", occurrences: 800, trend: "estável", category: "Gastronomia", categorySlug: "gastronomia", contentsFound: 700, updatedAt: "2026-06-01T12:00:00.000Z", popularity: "alta", related: [], contents: [] },
    { id: "3", hashtag: "conteudocriativo", occurrences: 120, trend: "alta", category: "Marketing", categorySlug: "marketing", contentsFound: 90, updatedAt: "2026-07-13T12:00:00.000Z", popularity: "média", related: [], contents: [] },
  ];

  it("combina busca, categoria, período e tendência", () => {
    expect(filterPublicHashtags(items, { query: "conteudo", category: "marketing", period: "7", trend: "alta" }, 20, new Date("2026-07-15T12:00:00.000Z")).map((item) => item.id)).toEqual(["1", "3"]);
  });

  it("exclui snapshots fora do período e respeita o limite administrativo", () => {
    expect(filterPublicHashtags(items, { period: "30" }, 1, new Date("2026-07-15T12:00:00.000Z"))).toHaveLength(1);
    expect(filterPublicHashtags(items, { period: "30" }, 20, new Date("2026-07-15T12:00:00.000Z")).some((item) => item.id === "2")).toBe(false);
  });

  it("agrupa o ranking recorrente sem repetir a mesma hashtag", () => {
    const recurring = getMostRecurringHashtags([...items, { ...items[0], id: "4", category: "Negócios", categorySlug: "negocios", occurrences: 100 }], 2);
    expect(recurring[0]).toMatchObject({ hashtag: "gastronomia", occurrences: 800 });
    expect(recurring.find((item) => item.hashtag === "marketing")).toMatchObject({ occurrences: 400, categories: ["Marketing", "Negócios"] });
  });

  it("monta o detalhe por hashtag e categoria sem duplicar conteúdos", () => {
    const content = { id: "post-1", url: "https://www.instagram.com/p/ABC/", thumbnailUrl: "", caption: "Exemplo", username: "criador", publishedAt: "", likes: 1, comments: 0, views: 0 };
    const detail = findPublicHashtagDetail([{ ...items[0], contents: [content] }, { ...items[0], id: "4", category: "Negócios", categorySlug: "negocios", contents: [content] }], "#marketing");
    expect(detail).toMatchObject({ hashtag: "marketing", occurrences: 600, categories: ["Marketing", "Negócios"] });
    expect(detail?.contents).toHaveLength(1);
    expect(findPublicHashtagDetail(items, "inexistente")).toBeNull();
  });
});

describe("decideHashtagResourceAccess", () => {
  it("libera o recurso público e preserva bloqueios de plano", () => {
    expect(decideHashtagResourceAccess(config)).toEqual({ available: true, locked: false, reason: "allowed" });
    expect(decideHashtagResourceAccess({ ...config, audience: "premium" })).toMatchObject({ available: true, locked: true, reason: "premium_required" });
  });

  it("desativa a página pela flag ou pelo catálogo", () => {
    expect(decideHashtagResourceAccess({ ...config, flagEnabled: false })).toMatchObject({ available: false, reason: "disabled" });
    expect(decideHashtagResourceAccess({ ...config, enabled: false })).toMatchObject({ available: false, reason: "disabled" });
  });
});

describe("public hashtag resource wiring", () => {
  const migration = readFileSync("supabase/migrations/202607150013_public_hashtag_resource.sql", "utf8");
  const page = readFileSync("src/app/recursos/hashtags/page.tsx", "utf8");
  const dataModule = readFileSync("src/lib/product-features/public-hashtags.ts", "utf8");

  it("registra catálogo e feature flag com o mesmo identificador", () => {
    expect(migration.match(/resource_hashtags/g)?.length).toBeGreaterThanOrEqual(2);
    expect(migration).toContain("cacheMinutes");
    expect(migration).toContain("indexable");
  });

  it("entrega canonical, OpenGraph, JSON-LD e breadcrumb", () => {
    expect(page).toContain("alternates: { canonical }");
    expect(page).toContain("openGraph:");
    expect(page).toContain('"@type": "BreadcrumbList"');
    expect(page).toContain('type="application/ld+json"');
  });

  it("lê somente snapshots válidos sem cliente do provedor", () => {
    expect(dataModule).toContain('.gt("expires_at"');
    expect(dataModule).toContain('unstable_cache(readValidHashtagSnapshots');
    expect(dataModule).not.toContain("scrape-creators");
    expect(dataModule).not.toContain("fetch(");
  });
});
