import { describe, expect, it } from "vitest";
import { pageCatalog, pageCatalogByKey } from "./page-catalog";
import { pageSeoFormSchema, seoImageSchema } from "./page-seo-schema";

describe("catálogo SEO", () => {
  it("mantém chaves e rotas únicas em um catálogo fechado", () => {
    expect(new Set(pageCatalog.map((page) => page.key)).size).toBe(pageCatalog.length);
    expect(new Set(pageCatalog.map((page) => page.route)).size).toBe(pageCatalog.length);
    expect(pageCatalogByKey.home.route).toBe("/");
    expect(pageCatalogByKey.branded_content.route).toBe("/recursos/conteudo-de-marca");
  });

  it("normaliza palavras-chave e rejeita rota arbitrária", () => {
    const result = pageSeoFormSchema.safeParse({ pageKey: "home", metaTitle: "Título válido para a página inicial", metaDescription: "Descrição segura e suficientemente clara para o mecanismo de busca.", metaKeywords: "instagram, métricas, instagram", ogTitle: "", ogDescription: "", ogImageUrl: "", canonicalUrl: "", indexable: "true", followLinks: "true" });
    expect(result.success && result.data.metaKeywords).toEqual(["instagram", "métricas"]);
    expect(pageSeoFormSchema.safeParse({ pageKey: "arbitrary", metaTitle: "", metaDescription: "", metaKeywords: "", ogTitle: "", ogDescription: "", ogImageUrl: "", canonicalUrl: "", indexable: "true", followLinks: "true" }).success).toBe(false);
  });
});

describe("validação de imagem SEO", () => {
  it("aceita formatos e tamanho previstos", () => {
    expect(seoImageSchema.safeParse({ name: "share-1200x630.webp", type: "image/webp", size: 900_000 }).success).toBe(true);
  });
  it("rejeita SVG, nome inseguro e arquivo acima de 2 MB", () => {
    expect(seoImageSchema.safeParse({ name: "share.svg", type: "image/svg+xml", size: 100 }).success).toBe(false);
    expect(seoImageSchema.safeParse({ name: "../share.png", type: "image/png", size: 100 }).success).toBe(false);
    expect(seoImageSchema.safeParse({ name: "share.png", type: "image/png", size: 2 * 1024 * 1024 + 1 }).success).toBe(false);
  });
});
