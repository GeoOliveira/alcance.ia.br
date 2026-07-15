import { afterEach, describe, expect, it, vi } from "vitest";
import { metaGet } from "./client";
import { MetaAuthenticationError, MetaConfigurationError, MetaInvalidResponseError, MetaProviderError } from "./errors";

const original = { ...process.env };
afterEach(() => { process.env = { ...original }; vi.restoreAllMocks(); });
function configure() { process.env.META_ACCESS_TOKEN = "a".repeat(40); process.env.META_GRAPH_API_VERSION = "v25.0"; process.env.META_GRAPH_API_URL = "https://graph.facebook.com"; process.env.META_BRANDED_CONTENT_TIMEOUT_MS = "15000"; }
describe("Meta client", () => {
  it("falha fechado sem token", async () => { delete process.env.META_ACCESS_TOKEN; await expect(metaGet("branded_content_search", new URLSearchParams())).rejects.toBeInstanceOf(MetaConfigurationError); });
  it("classifica token inválido sem expor corpo", async () => { configure(); vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: 190, message: "token secreto" } }), { status: 400 }))); await expect(metaGet("branded_content_search", new URLSearchParams())).rejects.toBeInstanceOf(MetaAuthenticationError); });
  it("rejeita resposta não JSON", async () => { configure(); vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("html", { status: 200 }))); await expect(metaGet("branded_content_search", new URLSearchParams())).rejects.toBeInstanceOf(MetaInvalidResponseError); });
  it("repete uma vez somente em erro transitório", async () => { configure(); const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: 1 } }), { status: 500 })); vi.stubGlobal("fetch", fetchMock); await expect(metaGet("branded_content_search", new URLSearchParams())).rejects.toBeInstanceOf(MetaProviderError); expect(fetchMock).toHaveBeenCalledTimes(2); });
  it("nunca inclui token no objeto de erro", async () => { configure(); vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: 1, message: process.env.META_ACCESS_TOKEN } }), { status: 500 }))); try { await metaGet("branded_content_search", new URLSearchParams()); } catch (error) { expect(JSON.stringify(error)).not.toContain(process.env.META_ACCESS_TOKEN); } });
});
