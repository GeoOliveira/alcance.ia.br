import { afterEach, describe, expect, it, vi } from "vitest";
import { issueFormToken } from "./form-token";
import { idempotencyKey, verifySubmission } from "./submission";

describe("submission protection", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("rejects a filled honeypot", async () => {
    await expect(verifySubmission(
      new Request("http://localhost"),
      "contact",
      { website: "bot", formToken: "x".repeat(40), turnstileToken: "" },
    )).rejects.toMatchObject({ status: 400, code: "spam_detected" });
  });

  it("accepts a correctly signed submission when Turnstile is disabled", async () => {
    vi.stubEnv("FORM_PROTECTION_SECRET", "a-secure-test-secret-with-at-least-32-characters");
    vi.stubEnv("FORM_MIN_SUBMIT_MS", "0");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    const token = await issueFormToken("analysis");
    await expect(verifySubmission(
      new Request("http://localhost"),
      "analysis",
      { website: "", formToken: token!, turnstileToken: "" },
    )).resolves.toBeUndefined();
  });

  it("requires a UUID idempotency key", () => {
    expect(() => idempotencyKey(new Request("http://localhost"))).toThrow();
    expect(idempotencyKey(new Request("http://localhost", {
      headers: { "idempotency-key": "0190f4a0-c6a8-7b44-9b54-e263c162c4b1" },
    }))).toBe("0190f4a0-c6a8-7b44-9b54-e263c162c4b1");
  });
});
