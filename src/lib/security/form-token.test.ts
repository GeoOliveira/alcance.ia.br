import { afterEach, describe, expect, it, vi } from "vitest";
import { issueFormToken, verifyFormToken } from "./form-token";

describe("signed form tokens", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("accepts a valid token after the minimum dwell time", async () => {
    vi.stubEnv("FORM_PROTECTION_SECRET", "a-secure-test-secret-with-at-least-32-characters");
    vi.stubEnv("FORM_MIN_SUBMIT_MS", "1200");
    const token = await issueFormToken("analysis", 10_000);
    expect(token).toBeTruthy();
    await expect(verifyFormToken(token!, "analysis", 11_200)).resolves.toEqual({ ok: true });
  });

  it("rejects submissions that are too fast", async () => {
    vi.stubEnv("FORM_PROTECTION_SECRET", "a-secure-test-secret-with-at-least-32-characters");
    const token = await issueFormToken("contact", 10_000);
    await expect(verifyFormToken(token!, "contact", 10_100)).resolves.toMatchObject({ ok: false, reason: "too_fast" });
  });

  it("rejects tampered and cross-form tokens", async () => {
    vi.stubEnv("FORM_PROTECTION_SECRET", "a-secure-test-secret-with-at-least-32-characters");
    vi.stubEnv("FORM_MIN_SUBMIT_MS", "0");
    const token = await issueFormToken("analysis", 10_000);
    await expect(verifyFormToken(`${token}x`, "analysis", 10_001)).resolves.toMatchObject({ ok: false });
    await expect(verifyFormToken(token!, "contact", 10_001)).resolves.toMatchObject({ ok: false });
  });

  it("rejects expired tokens", async () => {
    vi.stubEnv("FORM_PROTECTION_SECRET", "a-secure-test-secret-with-at-least-32-characters");
    vi.stubEnv("FORM_MIN_SUBMIT_MS", "0");
    vi.stubEnv("FORM_TOKEN_MAX_AGE_SECONDS", "60");
    const token = await issueFormToken("signup", 10_000);
    await expect(verifyFormToken(token!, "signup", 70_001)).resolves.toMatchObject({ ok: false, reason: "expired" });
  });

  it("fails closed without a production secret", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("FORM_PROTECTION_SECRET", "");
    await expect(issueFormToken("analysis")).resolves.toBeNull();
  });
});
