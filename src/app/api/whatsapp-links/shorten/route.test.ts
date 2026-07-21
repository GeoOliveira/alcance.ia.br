import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  config: vi.fn(), access: vi.fn(), runtime: vi.fn(), rateLimit: vi.fn(), shorten: vi.fn(), record: vi.fn(),
}));

vi.mock("@/lib/whatsapp/resource-config", () => ({ getWhatsAppGeneratorConfig: mocks.config }));
vi.mock("@/lib/security/rate-limit", () => ({ checkRateLimit: mocks.rateLimit }));
vi.mock("@/lib/integrations/encurta", () => ({
  createEncurtaRequestId: () => "req_internal123",
  createEncurtaShortLink: mocks.shorten,
  EncurtaError: class EncurtaError extends Error {},
  getShortenerRequestAccess: mocks.access,
  getShortenerRuntimeSettings: mocks.runtime,
  recordShortenerEvent: mocks.record,
}));

import { POST } from "./route";

function request(body: unknown = { phone: "(71) 99999-9999", message: "Olá", requestId: "req_operation123" }) {
  return new Request("http://localhost/api/whatsapp-links/shorten", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.9" }, body: JSON.stringify(body) });
}

describe("POST /api/whatsapp-links/shorten", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.access.mockResolvedValue({ userId: null, level: "anonymous" });
    mocks.config.mockResolvedValue({ access: { allowed: true }, flags: { shortener: true }, messageMaxCharacters: 500 });
    mocks.runtime.mockResolvedValue({ available: true, dailyLimit: 3, fallbackEnabled: true });
    mocks.rateLimit.mockResolvedValue({ available: true, allowed: true, retryAfter: 0 });
    mocks.record.mockResolvedValue(undefined);
    mocks.shorten.mockResolvedValue({ id: "id-1", slug: "B7xK", shortUrl: "https://encurta.io/B7xK", officialUrl: "https://wa.me/5571999999999?text=Ol%C3%A1", status: "active", expiresAt: null, createdAt: "2026-07-17T20:00:00.000Z", idempotentReplay: false, retryCount: 1 });
  });

  it("returns only the safe normalized result and records sanitized metadata", async () => {
    const response = await POST(request());
    expect(response.status).toBe(200);
    const payload = await response.json();
    expect(payload.data.shortUrl).toBe("https://encurta.io/B7xK");
    expect(payload.data).not.toHaveProperty("retryCount");
    expect(mocks.shorten).toHaveBeenCalledWith(expect.objectContaining({ phone: "5571999999999", requestId: "req_operation123", accessLevel: "anonymous" }));
    expect(mocks.record).toHaveBeenCalledWith(expect.not.objectContaining({ phone: expect.anything(), message: expect.anything() }));
  });

  it("blocks the external call when the access flag is disabled", async () => {
    mocks.config.mockResolvedValue({ access: { allowed: true }, flags: { shortener: false }, messageMaxCharacters: 500 });
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(mocks.shorten).not.toHaveBeenCalled();
  });

  it("uses the configured tier limit and returns Retry-After", async () => {
    mocks.rateLimit.mockResolvedValue({ available: true, allowed: false, retryAfter: 120 });
    const response = await POST(request());
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("120");
    expect(mocks.rateLimit).toHaveBeenCalledWith(expect.any(Request), "whatsapp-shortener", undefined, expect.objectContaining({ limit: 3, windowSeconds: 86400 }));
    expect(mocks.shorten).not.toHaveBeenCalled();
  });

  it("rejects generic proxy fields", async () => {
    const response = await POST(request({ phone: "71999999999", destinationUrl: "https://example.com" }));
    expect(response.status).toBe(422);
    expect(mocks.shorten).not.toHaveBeenCalled();
  });
});
