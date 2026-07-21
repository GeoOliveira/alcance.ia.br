import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  issueFormToken: vi.fn(),
  getPublicSettings: vi.fn(),
  getPublicFlags: vi.fn(),
}));

vi.mock("@/lib/security/rate-limit", () => ({ checkRateLimit: mocks.checkRateLimit }));
vi.mock("@/lib/security/form-token", () => ({
  issueFormToken: mocks.issueFormToken,
  isProtectedForm: (value: string | null) => value === "analysis" || value === "contact" || value === "signup",
}));
vi.mock("@/lib/settings/get-settings", () => ({ getPublicSettings: mocks.getPublicSettings }));
vi.mock("@/lib/settings/public-content", () => ({ getPublicFlags: mocks.getPublicFlags }));

import { GET } from "./route";

describe("GET /api/form-token", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkRateLimit.mockResolvedValue({ allowed: true, available: true, retryAfter: 0 });
    mocks.issueFormToken.mockResolvedValue("signed-token");
    mocks.getPublicSettings.mockResolvedValue({ maintenanceEnabled: false, analysisEnabled: true, signupEnabled: false });
    mocks.getPublicFlags.mockResolvedValue({ instagram_analysis: true, contact_form: true, user_signup: false });
  });

  it("issues a token only for an available known form", async () => {
    const response = await GET(new Request("http://localhost/api/form-token?form=analysis"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ token: "signed-token" });
    expect(mocks.issueFormToken).toHaveBeenCalledWith("analysis");
  });

  it("rejects unknown form names", async () => {
    const response = await GET(new Request("http://localhost/api/form-token?form=unknown"));

    expect(response.status).toBe(400);
    expect(mocks.issueFormToken).not.toHaveBeenCalled();
  });

  it("fails closed when the requested form is disabled", async () => {
    const response = await GET(new Request("http://localhost/api/form-token?form=signup"));

    expect(response.status).toBe(503);
    expect(mocks.issueFormToken).not.toHaveBeenCalled();
  });
});
