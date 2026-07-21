import "server-only";
import { createHash, createHmac } from "node:crypto";

export function sha256(value: string) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

export function buildEncurtaSignaturePayload(input: {
  timestamp: string;
  method: string;
  path: string;
  requestId: string;
  body: string;
}) {
  return [input.timestamp, input.method.toUpperCase(), input.path, input.requestId, sha256(input.body)].join("\n");
}

export function createEncurtaRequestSignature(secret: string, input: Parameters<typeof buildEncurtaSignaturePayload>[0]) {
  return `sha256=${createHmac("sha256", secret).update(buildEncurtaSignaturePayload(input), "utf8").digest("hex")}`;
}
