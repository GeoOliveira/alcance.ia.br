import { beforeEach, describe, expect, it } from "vitest";
import { clearBrandedContentCacheForTests, getCachedSearch, setCachedSearch } from "./cache";
import { normalizeFacebookPageUrl, normalizeInstagramUsername, normalizeResult, safeHttpsUrl, typeLabel } from "./normalize";
import { deduplicateResults, extractAfter } from "./pagination";
import { searchQuerySchema } from "./validation";

describe("branded content validation", () => {
  it("normaliza username", () => expect(normalizeInstagramUsername("  @Nike  ")).toBe("nike"));
  it.each(["https://instagram.com/nike", "a/b", "a?x=1", "a#x", "a..b", "@", "nome com espaço"])("rejeita username inválido: %s", (value) => expect(() => normalizeInstagramUsername(value)).toThrow());
  it("normaliza URL simples de Página", () => expect(normalizeFacebookPageUrl("https://facebook.com/MarcaExemplo/")).toBe("https://www.facebook.com/MarcaExemplo"));
  it.each(["http://facebook.com/marca", "https://evil.com/marca", "https://facebook.com.evil.com/marca", "https://user@facebook.com/marca", "javascript:alert(1)", "https://facebook.com/groups/123", "https://facebook.com/marca/posts/1", "https://m.facebook.com/marca"])("rejeita URL não validada: %s", (value) => expect(() => normalizeFacebookPageUrl(value)).toThrow());
  it("exige exatamente um identificador", () => expect(searchQuerySchema.safeParse({ platform: "instagram", username: "nike", pageUrl: "https://facebook.com/nike", dateMin: "2026-01-01", dateMax: "2026-02-01" }).success).toBe(false));
  it("valida período", () => expect(searchQuerySchema.safeParse({ platform: "instagram", username: "nike", dateMin: "2026-01-01", dateMax: "2026-02-01" }).success).toBe(true));
  it.each([["2026-03-01", "2026-02-01"], ["2023-08-16", "2026-02-01"], ["2026-01-01", "2999-01-01"]])("rejeita período %s a %s", (dateMin, dateMax) => expect(searchQuerySchema.safeParse({ platform: "instagram", username: "nike", dateMin, dateMax }).success).toBe(false));
  it("rejeita cursor com controle e parâmetros extras", () => { expect(searchQuerySchema.safeParse({ platform: "instagram", username: "nike", dateMin: "2026-01-01", dateMax: "2026-02-01", after: "a\n" }).success).toBe(false); expect(searchQuerySchema.safeParse({ platform: "instagram", username: "nike", dateMin: "2026-01-01", dateMax: "2026-02-01", fields: "secret" }).success).toBe(false); });
});

describe("normalização defensiva", () => {
  it("mapeia tipo desconhecido", () => expect(typeLabel("new_type")).toBe("Conteúdo"));
  it("remove URL insegura", () => expect(safeHttpsUrl("javascript:alert(1)")).toBeNull());
  it("aceita criador ausente e parceiros vazios", async () => expect(await normalizeResult({ type: "PHOTO", partners: [] })).toMatchObject({ typeLabel: "Imagem", creator: null, partners: [], contentUrl: null }));
  it("gera ID estável sem índice", async () => { const input = { type: "POST", creation_date: "2026-01-01T00:00:00Z", url: "https://example.com/post" }; expect((await normalizeResult(input)).id).toBe((await normalizeResult(input)).id); });
  it("extrai somente cursor e ignora paging.next", () => expect(extractAfter({ cursors: { after: "opaque" }, next: "https://graph.facebook.com/?access_token=secret" })).toBe("opaque"));
  it("deduplica por ID", async () => { const item = await normalizeResult({ type: "POST", url: "https://example.com/post" }); expect(deduplicateResults([item, item])).toHaveLength(1); });
});

describe("cache", () => {
  beforeEach(clearBrandedContentCacheForTests);
  it("guarda somente a resposta normalizada", () => { const response = { results: [], pagination: { mode: "none" as const, hasNextPage: false, cursor: null, offset: null, after: null }, meta: { platform: "instagram" as const, queryDisplay: "@x", dateMin: "2026-01-01", dateMax: "2026-02-01", loadedResults: 0, fromCache: false, searchedAt: "2026-02-01T00:00:00Z" } }; setCachedSearch("key", response, 15); expect(getCachedSearch("key")).toEqual(response); });
});
