import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  insert: vi.fn(),
  verifySubmission: vi.fn(),
  checkRateLimit: vi.fn(),
  getPublicSettings: vi.fn(),
  getPublicFlags: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: () => ({ insert: mocks.insert }) }),
}));
vi.mock("@/lib/security/rate-limit", () => ({ checkRateLimit: mocks.checkRateLimit }));
vi.mock("@/lib/settings/get-settings", () => ({ getPublicSettings: mocks.getPublicSettings }));
vi.mock("@/lib/settings/public-content", () => ({ getPublicFlags: mocks.getPublicFlags }));
vi.mock("@/lib/security/submission", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/security/submission")>();
  return { ...original, verifySubmission: mocks.verifySubmission };
});

import { POST } from "./route";

const body = {
  name: "Maria Silva",
  email: "maria@example.com",
  subject: "support",
  message: "Preciso de ajuda com a análise.",
  privacyAccepted: true,
  website: "",
  formToken: "x".repeat(40),
  turnstileToken: "",
};

function request(payload: unknown = body) {
  return new Request("http://localhost/api/contact", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "idempotency-key": "0190f4a0-c6a8-7b44-9b54-e263c162c4b1",
    },
    body: JSON.stringify(payload),
  });
}

describe("POST /api/contact", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkRateLimit.mockResolvedValue({ allowed: true, available: true, retryAfter: 0 });
    mocks.verifySubmission.mockResolvedValue(undefined);
    mocks.insert.mockResolvedValue({ error: null });
    mocks.getPublicSettings.mockResolvedValue({ maintenanceEnabled: false });
    mocks.getPublicFlags.mockResolvedValue({ contact_form: true });
  });

  it("persists a validated submission with its idempotency key", async () => {
    const response = await POST(request());
    expect(response.status).toBe(201);
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
      idempotency_key: "0190f4a0-c6a8-7b44-9b54-e263c162c4b1",
      email: "maria@example.com",
    }));
    expect(response.headers.get("x-request-id")).toBeTruthy();
  });

  it("returns success for a replayed idempotency key", async () => {
    mocks.insert.mockResolvedValue({ error: { code: "23505" } });
    const response = await POST(request());
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("rejects an oversized payload before persistence", async () => {
    const response = await POST(request({ ...body, message: "a".repeat(9000) }));
    expect(response.status).toBe(413);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("fails closed while the public contact form is disabled", async () => {
    mocks.getPublicFlags.mockResolvedValue({ contact_form: false });
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});
