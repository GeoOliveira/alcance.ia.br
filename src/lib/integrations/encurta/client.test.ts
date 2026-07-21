import { afterEach, describe, expect, it, vi } from "vitest";
import { createEncurtaShortLink, getEncurtaLinkSnapshot } from "./client";
import { EncurtaError } from "./errors";

const response = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

describe("Encurta.io client", () => {
  afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

  it("fails closed when the integration is disabled", async () => {
    vi.stubEnv("ENCURTA_INTEGRATION_ENABLED", "false");
    await expect(createEncurtaShortLink({ phone: "5571999999999", officialUrl: "https://wa.me/5571999999999", requestId: "req_12345678" })).rejects.toMatchObject({ code: "integration_disabled" });
  });

  it("sends the documented headers and normalizes a 201 response", async () => {
    vi.stubEnv("ENCURTA_INTEGRATION_ENABLED", "true");
    vi.stubEnv("ENCURTA_API_URL", "https://encurta.io");
    vi.stubEnv("ENCURTA_API_KEY", "k".repeat(24));
    vi.stubEnv("ENCURTA_HMAC_SECRET", "s".repeat(32));
    const fetchMock = vi.fn().mockResolvedValue(response(201, { data: { id: "id-1", slug: "B7xK", shortUrl: "https://encurta.io/B7xK", destinationType: "whatsapp", status: "active", expiresAt: null, createdAt: "2026-07-17T20:00:00.000Z" }, meta: { idempotentReplay: false } }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await createEncurtaShortLink({ phone: "5571999999999", message: "Olá!", officialUrl: "https://wa.me/5571999999999?text=Ol%C3%A1%21", requestId: "req_12345678" });
    expect(result.shortUrl).toBe("https://encurta.io/B7xK");
    expect(result.officialUrl).toContain("wa.me");
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect((request.headers as Record<string, string>)["Authorization"]).toMatch(/^Bearer /);
    expect((request.headers as Record<string, string>)["X-Request-Id"]).toBe("req_12345678");
    expect((request.headers as Record<string, string>)["X-Signature"]).toMatch(/^sha256=/);
    expect(JSON.parse(String(request.body))).toMatchObject({ destinationType: "whatsapp", phone: "5571999999999", externalResourceId: "whatsapp_link_generator" });
  });

  it("retries a 503 with the same request ID", async () => {
    vi.stubEnv("ENCURTA_INTEGRATION_ENABLED", "true");
    vi.stubEnv("ENCURTA_API_KEY", "k".repeat(24));
    vi.stubEnv("ENCURTA_HMAC_SECRET", "s".repeat(32));
    vi.stubEnv("ENCURTA_API_URL", "https://encurta.io");
    vi.stubEnv("ENCURTA_MAX_RETRIES", "1");
    const fetchMock = vi.fn().mockResolvedValueOnce(response(503, { error: { code: "SERVICE_UNAVAILABLE", retryable: true } })).mockResolvedValueOnce(response(200, { data: { id: "id-1", slug: "B7xK", shortUrl: "https://encurta.io/B7xK", destinationType: "whatsapp", status: "active", expiresAt: null, createdAt: "2026-07-17T20:00:00.000Z" }, meta: { idempotentReplay: true } }));
    vi.stubGlobal("fetch", fetchMock);
    const result = await createEncurtaShortLink({ phone: "5571999999999", officialUrl: "https://wa.me/5571999999999", requestId: "req_12345678" });
    expect(result.idempotentReplay).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect((fetchMock.mock.calls[0]?.[1] as RequestInit).headers).toMatchObject({ "X-Request-Id": "req_12345678" });
    expect((fetchMock.mock.calls[1]?.[1] as RequestInit).headers).toMatchObject({ "X-Request-Id": "req_12345678" });
  });

  it("does not retry a conflict", async () => {
    vi.stubEnv("ENCURTA_INTEGRATION_ENABLED", "true");
    vi.stubEnv("ENCURTA_API_KEY", "k".repeat(24));
    vi.stubEnv("ENCURTA_HMAC_SECRET", "s".repeat(32));
    vi.stubEnv("ENCURTA_API_URL", "https://encurta.io");
    const fetchMock = vi.fn().mockResolvedValue(response(409, { error: { code: "IDEMPOTENCY_CONFLICT" } }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(createEncurtaShortLink({ phone: "5571999999999", officialUrl: "https://wa.me/5571999999999", requestId: "req_12345678" })).rejects.toBeInstanceOf(EncurtaError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([400, 401, 403, 422, 429, 500])("does not retry HTTP %s", async (status) => {
    vi.stubEnv("ENCURTA_INTEGRATION_ENABLED", "true");
    vi.stubEnv("ENCURTA_API_URL", "https://encurta.io");
    vi.stubEnv("ENCURTA_API_KEY", "k".repeat(24));
    vi.stubEnv("ENCURTA_HMAC_SECRET", "s".repeat(32));
    const fetchMock = vi.fn().mockResolvedValue(response(status, { error: { code: status === 429 ? "RATE_LIMIT_EXCEEDED" : "ERROR" } }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(createEncurtaShortLink({ phone: "5571999999999", officialUrl: "https://wa.me/5571999999999", requestId: "req_12345678" })).rejects.toBeInstanceOf(EncurtaError);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("rejects an invalid external response", async () => {
    vi.stubEnv("ENCURTA_INTEGRATION_ENABLED", "true");
    vi.stubEnv("ENCURTA_API_URL", "https://encurta.io");
    vi.stubEnv("ENCURTA_API_KEY", "k".repeat(24));
    vi.stubEnv("ENCURTA_HMAC_SECRET", "s".repeat(32));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response(201, { data: { shortUrl: "https://evil.example/link" } })));
    await expect(createEncurtaShortLink({ phone: "5571999999999", officialUrl: "https://wa.me/5571999999999", requestId: "req_12345678" })).rejects.toMatchObject({ code: "invalid_response" });
  });

  it("fails closed when the configured URL is invalid", async () => {
    vi.stubEnv("ENCURTA_INTEGRATION_ENABLED", "true");
    vi.stubEnv("ENCURTA_API_URL", "http://encurta.io");
    vi.stubEnv("ENCURTA_API_KEY", "k".repeat(24));
    vi.stubEnv("ENCURTA_HMAC_SECRET", "s".repeat(32));
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    await expect(createEncurtaShortLink({ phone: "5571999999999", officialUrl: "https://wa.me/5571999999999" })).rejects.toMatchObject({ code: "not_configured" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("queries a link snapshot with the verified signed GET contract", async () => {
    vi.stubEnv("ENCURTA_INTEGRATION_ENABLED", "true");
    vi.stubEnv("ENCURTA_API_URL", "https://encurta.io");
    vi.stubEnv("ENCURTA_API_KEY", "k".repeat(24));
    vi.stubEnv("ENCURTA_HMAC_SECRET", "s".repeat(32));
    const id = "018f7ec3-8421-7ef6-91bb-31f22d794620";
    const fetchMock = vi.fn().mockResolvedValue(response(200, { data: { id, slug: "B7xK", shortUrl: "https://encurta.io/B7xK", destinationType: "whatsapp", status: "active", expiresAt: null, createdAt: "2026-07-17T20:00:00.000Z", lastAccessedAt: "2026-07-20T20:00:00.000Z", clickCount: 12 }, meta: { requestId: "req_test" } }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(getEncurtaLinkSnapshot(id)).resolves.toMatchObject({ clickCount: 12, status: "active" });
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(request.method).toBe("GET");
    expect((request.headers as Record<string, string>)["X-Signature"]).toMatch(/^sha256=/);
  });
});
