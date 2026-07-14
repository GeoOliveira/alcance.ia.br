import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { scrapeCreatorsFetch } from "./client";
import { readScrapeCreatorsConfig } from "./config";
import { ScrapeCreatorsAuthenticationError, ScrapeCreatorsInvalidResponseError, ScrapeCreatorsNotFoundError, ScrapeCreatorsProviderError, ScrapeCreatorsRateLimitError, ScrapeCreatorsTimeoutError } from "./errors";
import { extractItems, mapPost, mapProfile } from "./mapper";
import { normalizeInstagramHandle, normalizePostIdentifier } from "./provider";
import { limitStoredData, sanitizeProviderData } from "./sanitize";

const config = { apiKey: "test-key", baseUrl: "https://api.scrapecreators.com", timeoutMs: 1000, enabled: true };
describe("ScrapeCreators POC", () => {
  const original = { ...process.env };
  beforeEach(() => { vi.unstubAllGlobals(); process.env = { ...original }; });
  afterEach(() => { process.env = { ...original }; });

  it("recusa configuração e chave ausentes", () => { delete process.env.SCRAPECREATORS_API_KEY; process.env.SCRAPECREATORS_POC_ENABLED = "true"; expect(() => readScrapeCreatorsConfig()).toThrow(/não está configurada/); });
  it("recusa POC desativada no ambiente", () => { process.env.SCRAPECREATORS_API_KEY = "secret"; process.env.SCRAPECREATORS_POC_ENABLED = "false"; expect(() => readScrapeCreatorsConfig()).toThrow(/desativada/); });
  it("normaliza nomes válidos com ponto e sublinhado", () => expect(normalizeInstagramHandle(" @Nome.Valido_1 ")).toBe("nome.valido_1"));
  it.each(["a..b", ".inicio", "fim.", "inválido!", ""])("recusa nome inválido %s", (value) => expect(() => normalizeInstagramHandle(value)).toThrow());
  it("aceita URL e shortcode de post", () => { expect(normalizePostIdentifier("https://www.instagram.com/reel/Abc_123/" )).toContain("Abc_123"); expect(normalizePostIdentifier("Abc_123")).toContain("Abc_123"); });

  it.each([[401, ScrapeCreatorsAuthenticationError], [403, ScrapeCreatorsAuthenticationError], [404, ScrapeCreatorsNotFoundError], [429, ScrapeCreatorsRateLimitError]])("classifica HTTP %s sem retry", async (status, ErrorType) => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: "redacted" }), { status: status as number, headers: { "content-type": "application/json" } })); vi.stubGlobal("fetch", fetchMock);
    await expect(scrapeCreatorsFetch(config, "profile", "/test", {})).rejects.toBeInstanceOf(ErrorType); expect(fetchMock).toHaveBeenCalledTimes(1);
  });
  it("faz somente um retry para 500", async () => { const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 500, headers: { "content-type": "application/json" } })); vi.stubGlobal("fetch", fetchMock); await expect(scrapeCreatorsFetch(config, "profile", "/test", {})).rejects.toBeInstanceOf(ScrapeCreatorsProviderError); expect(fetchMock).toHaveBeenCalledTimes(2); });
  it("não repete resposta inválida", async () => { const fetchMock = vi.fn().mockResolvedValue(new Response("não-json", { status: 200, headers: { "content-type": "text/plain" } })); vi.stubGlobal("fetch", fetchMock); await expect(scrapeCreatorsFetch(config, "profile", "/test", {})).rejects.toBeInstanceOf(ScrapeCreatorsInvalidResponseError); expect(fetchMock).toHaveBeenCalledTimes(1); });
  it("trata JSON inválido", async () => { vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{", { status: 200, headers: { "content-type": "application/json" } }))); await expect(scrapeCreatorsFetch(config, "profile", "/test", {})).rejects.toBeInstanceOf(ScrapeCreatorsInvalidResponseError); });
  it("trata timeout", async () => {
    const slow = { ...config, timeoutMs: 10 };
    const fetchMock = vi.fn((_url: URL, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(scrapeCreatorsFetch(slow, "profile", "/test", {})).rejects.toBeInstanceOf(ScrapeCreatorsTimeoutError);
  });

  it("mapeia perfil sem inventar zero", () => { const profile = mapProfile({ data: { user: { id: "1", username: "teste", full_name: "Teste", edge_followed_by: { count: 12 }, is_private: false } } }, "2026-01-01T00:00:00.000Z"); expect(profile.followersCount).toBe(12); expect(profile.postsCount).toBeNull(); expect(profile.isPrivate).toBe(false); });
  it("mapeia post, nulos, hashtags e menções", () => { const post = mapPost({ id: "1", code: "ABC", media_type: 2, caption: { text: "Oi #Teste @Pessoa" }, like_count: null, play_count: 90 }); expect(post.mediaType).toBe("video"); expect(post.likeCount).toBeNull(); expect(post.hashtags).toEqual(["teste"]); expect(post.mentions).toEqual(["pessoa"]); });
  it("extrai o objeto media do envelope de Reels", () => expect(extractItems("reels", { items: [{ media: { id: "reel-1", play_count: 10 } }] })).toEqual([{ id: "reel-1", play_count: 10 }]));
  it("sanitiza segredos e query strings assinadas", () => { const result = sanitizeProviderData({ api_key: "secret", nested: { authorization: "bearer", url: "https://x.cdninstagram.com/file.jpg?token=secret" } }) as Record<string, unknown>; expect(result).not.toHaveProperty("api_key"); expect(result.nested).toEqual({ url: "https://x.cdninstagram.com/file.jpg" }); });
  it("limita o tamanho salvo", () => expect(limitStoredData({ value: "x".repeat(1000) }, 100)).toMatchObject({ truncated: true }));
});
