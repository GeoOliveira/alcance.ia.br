import { describe, expect, it } from "vitest";
import { readJsonBody, SafeHttpError } from "./http";

describe("readJsonBody", () => {
  it("accepts a JSON object below the limit", async () => {
    const request = new Request("http://localhost/api", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: true }),
    });
    await expect(readJsonBody(request, 100)).resolves.toEqual({ ok: true });
  });

  it("rejects a body larger than the byte limit", async () => {
    const request = new Request("http://localhost/api", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ value: "á".repeat(100) }),
    });
    await expect(readJsonBody(request, 50)).rejects.toMatchObject({ status: 413 } satisfies Partial<SafeHttpError>);
  });

  it("rejects non-JSON content", async () => {
    const request = new Request("http://localhost/api", { method: "POST", body: "hello" });
    await expect(readJsonBody(request, 100)).rejects.toMatchObject({ status: 415 } satisfies Partial<SafeHttpError>);
  });
});
