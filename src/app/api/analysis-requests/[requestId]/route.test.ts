import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ status: vi.fn(), process: vi.fn(), after: vi.fn(), generateAI: vi.fn() }));
vi.mock("next/server", async (importOriginal) => ({ ...await importOriginal<typeof import("next/server")>(), after: mocks.after }));
vi.mock("@/lib/analysis/get-analysis-by-id", () => ({ getSafeAnalysisStatus: mocks.status }));
vi.mock("@/lib/analysis/process-analysis", () => ({ processAnalysis: mocks.process }));
vi.mock("@/lib/ai", () => ({ generateAIAnalysisForRequest: mocks.generateAI }));
import { GET, POST } from "./route";

const id = "0190f4a0-c6a8-7b44-9b54-e263c162c4b1";
const session = "0190f4a0-c6a8-7b44-9b54-e263c162c4b2";
const request = (method = "GET") =>
  new NextRequest(`http://localhost/api/analysis-requests/${id}`, {
    method,
    headers: { cookie: `alcance_anonymous_session=${session}` },
  });
const context = { params: Promise.resolve({ requestId: id }) };

describe("individual analysis API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns only safe status for the owning session", async () => {
    mocks.status.mockResolvedValue({ state: "completed", stage: "complete", aiState: "processing" });
    const response = await GET(request(), context);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ state: "completed", stage: "complete", aiState: "processing" });
    expect(mocks.status).toHaveBeenCalledWith(id, session);
  });

  it("returns 404 when ownership cannot be verified", async () => {
    mocks.status.mockResolvedValue(null);
    expect((await GET(request(), context)).status).toBe(404);
  });

  it("starts server processing for the owning session", async () => {
    mocks.process.mockResolvedValue({ ok: true, complete: true });
    const response = await POST(request("POST"), context);

    expect(response.status).toBe(200);
    expect(mocks.process).toHaveBeenCalledWith(id, session);
    expect(mocks.after).toHaveBeenCalledOnce();
  });

  it("does not expose processing errors", async () => {
    mocks.process.mockResolvedValue({ ok: false, code: "provider_error" });
    const response = await POST(request("POST"), context);

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({ ok: false, code: "provider_error" });
  });
});
