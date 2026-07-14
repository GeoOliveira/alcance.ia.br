import { describe, expect, it } from "vitest";
import { MemoryRateLimitStore, requestFingerprint } from "./rate-limit";

describe("rate limiting", () => {
  it("blocks requests after the configured limit", async () => {
    const store = new MemoryRateLimitStore();
    const input = { keyHash: "a".repeat(64), route: "contact" as const, limit: 2, windowSeconds: 60 };
    expect((await store.consume(input)).allowed).toBe(true);
    expect((await store.consume(input)).allowed).toBe(true);
    expect((await store.consume(input)).allowed).toBe(false);
  });

  it("hashes the client address instead of returning it", async () => {
    const request = new Request("http://localhost", { headers: { "x-forwarded-for": "203.0.113.7" } });
    const fingerprint = await requestFingerprint(request);
    expect(fingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(fingerprint).not.toContain("203.0.113.7");
  });
});
