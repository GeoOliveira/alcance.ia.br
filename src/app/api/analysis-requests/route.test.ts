import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  checkRateLimit: vi.fn(),
  verifySubmission: vi.fn(),
  getPublicSettings: vi.fn(),
  getPublicFlags: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: () => ({ rpc: mocks.rpc }) }));
vi.mock("@/lib/security/rate-limit", () => ({ checkRateLimit: mocks.checkRateLimit }));
vi.mock("@/lib/settings/get-settings", () => ({ getPublicSettings: mocks.getPublicSettings }));
vi.mock("@/lib/settings/public-content", () => ({ getPublicFlags: mocks.getPublicFlags }));
vi.mock("@/lib/security/submission", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/security/submission")>();
  return { ...original, verifySubmission: mocks.verifySubmission };
});

import { POST } from "./route";

const validBody = {
  instagram: "alcanceia",
  landingPage: "/",
  referrer: "",
  website: "",
  formToken: "x".repeat(40),
  turnstileToken: "",
};

function request(payload: unknown = validBody) {
  return new NextRequest("http://localhost/api/analysis-requests", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "idempotency-key": "0190f4a0-c6a8-7b44-9b54-e263c162c4b1",
    },
    body: JSON.stringify(payload),
  });
}

describe("POST /api/analysis-requests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkRateLimit.mockResolvedValue({ allowed: true, available: true, retryAfter: 0 });
    mocks.verifySubmission.mockResolvedValue(undefined);
    mocks.getPublicSettings.mockResolvedValue({ maintenanceEnabled: false, analysisEnabled: true });
    mocks.getPublicFlags.mockResolvedValue({ instagram_analysis: true });
    mocks.rpc.mockResolvedValue({ data: [{ request_id: "0190f4a0-c6a8-7b44-9b54-e263c162c4b2", created: true }], error: null });
  });

  it("creates a protected request and sets an anonymous session", async () => {
    const response = await POST(request());

    expect(response.status).toBe(201);
    expect(mocks.rpc).toHaveBeenCalledWith("create_analysis_request_secure", expect.objectContaining({
      p_instagram_username: "alcanceia",
      p_idempotency_key: "0190f4a0-c6a8-7b44-9b54-e263c162c4b1",
    }));
    expect(response.headers.get("set-cookie")).toContain("alcance_anonymous_session=");
  });

  it("rejects oversized submissions before storage", async () => {
    const response = await POST(request({ ...validBody, padding: "a".repeat(5000) }));

    expect(response.status).toBe(413);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("fails closed while analysis submissions are disabled", async () => {
    mocks.getPublicSettings.mockResolvedValue({ maintenanceEnabled: false, analysisEnabled: false });
    const response = await POST(request());

    expect(response.status).toBe(503);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});
