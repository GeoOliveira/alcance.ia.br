import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  insert: vi.fn(),
}));

vi.mock("@/lib/security/rate-limit", () => ({ checkRateLimit: mocks.checkRateLimit }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: () => ({ insert: mocks.insert }) }),
}));

import { POST } from "./route";

function request(body: string, contentType = "application/json") {
  return new NextRequest("http://localhost/api/feature-interest", {
    method: "POST",
    headers: { "content-type": contentType, "x-forwarded-for": "203.0.113.10" },
    body,
  });
}

describe("POST /api/feature-interest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.checkRateLimit.mockResolvedValue({ allowed: true, available: true, retryAfter: 0 });
    mocks.insert.mockResolvedValue({ error: null });
  });

  it("uses an independent rate-limit bucket and stores valid interest", async () => {
    const response = await POST(request(JSON.stringify({ featureKey: "branded_content_search", source: "resources_page" })));

    expect(response.status).toBe(200);
    expect(mocks.checkRateLimit).toHaveBeenCalledWith(expect.any(Request), "feature-interest");
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
      feature_key: "branded_content_search",
      source: "resources_page",
    }));
  });

  it("rejects unsupported content types before persistence", async () => {
    const response = await POST(request(JSON.stringify({ featureKey: "branded_content_search", source: "resources_page" }), "text/plain"));

    expect(response.status).toBe(415);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("rejects oversized bodies before persistence", async () => {
    const response = await POST(request(JSON.stringify({ featureKey: "branded_content_search", source: "resources_page", padding: "a".repeat(1100) })));

    expect(response.status).toBe(413);
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});
