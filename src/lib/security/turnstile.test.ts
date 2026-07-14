import { afterEach, describe, expect, it, vi } from "vitest";
import { verifyTurnstileToken } from "./turnstile";

describe("Turnstile verification", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("is optional when no server secret is configured", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    await expect(verifyTurnstileToken("")).resolves.toEqual({ ok: true, configured: false });
  });

  it("fails closed when configured without a token", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    await expect(verifyTurnstileToken("")).resolves.toEqual({ ok: false, configured: true });
  });

  it("accepts only a successful provider response", async () => {
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret");
    const fetcher = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));
    await expect(verifyTurnstileToken("token", "203.0.113.8", fetcher)).resolves.toEqual({ ok: true, configured: true });
    const body = fetcher.mock.calls[0]?.[1]?.body as URLSearchParams;
    expect(body.get("remoteip")).toBe("203.0.113.8");
  });
});
