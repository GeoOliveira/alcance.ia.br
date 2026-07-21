import { describe, expect, it } from "vitest";
import { buildEncurtaSignaturePayload, createEncurtaRequestSignature, sha256 } from "./signature";

describe("Encurta.io HMAC contract", () => {
  const input = { timestamp: "2026-07-17T20:00:00.000Z", method: "POST", path: "/api/internal/v1/links", requestId: "req_12345678", body: '{"destinationType":"whatsapp"}' };

  it("hashes the exact serialized body and preserves field order", () => {
    expect(sha256(input.body)).toHaveLength(64);
    expect(buildEncurtaSignaturePayload(input)).toBe(`${input.timestamp}\nPOST\n${input.path}\n${input.requestId}\n${sha256(input.body)}`);
  });

  it("creates the documented sha256 signature prefix", () => {
    expect(createEncurtaRequestSignature("a".repeat(32), input)).toMatch(/^sha256=[a-f0-9]{64}$/);
  });
});
