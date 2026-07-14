import "server-only";
import { integerFromEnv } from "./http";

export type ProtectedForm = "analysis" | "contact" | "signup";
type TokenPayload = { form: ProtectedForm; issuedAt: number; nonce: string };

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64Url(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function protectionSecret() {
  const configured = process.env.FORM_PROTECTION_SECRET;
  if (configured && configured.length >= 32) return configured;
  if (process.env.NODE_ENV !== "production") return "development-only-form-protection-key";
  return null;
}

async function signingKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

export async function issueFormToken(form: ProtectedForm, now = Date.now()) {
  const secret = protectionSecret();
  if (!secret) return null;
  const payload: TokenPayload = { form, issuedAt: now, nonce: crypto.randomUUID() };
  const encodedPayload = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign("HMAC", await signingKey(secret), encoder.encode(encodedPayload));
  return `${encodedPayload}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifyFormToken(
  token: string,
  expectedForm: ProtectedForm,
  now = Date.now(),
) {
  const secret = protectionSecret();
  if (!secret || !token || token.length > 1000) return { ok: false as const, reason: "unavailable" };

  try {
    const [encodedPayload, encodedSignature, extra] = token.split(".");
    if (!encodedPayload || !encodedSignature || extra) return { ok: false as const, reason: "invalid" };
    const validSignature = await crypto.subtle.verify(
      "HMAC",
      await signingKey(secret),
      fromBase64Url(encodedSignature),
      encoder.encode(encodedPayload),
    );
    if (!validSignature) return { ok: false as const, reason: "invalid" };

    const payload = JSON.parse(decoder.decode(fromBase64Url(encodedPayload))) as Partial<TokenPayload>;
    const minAge = integerFromEnv("FORM_MIN_SUBMIT_MS", 1200, 0, 60_000);
    const maxAge = integerFromEnv("FORM_TOKEN_MAX_AGE_SECONDS", 7200, 60, 86_400) * 1000;
    if (payload.form !== expectedForm || typeof payload.issuedAt !== "number") {
      return { ok: false as const, reason: "invalid" };
    }
    const age = now - payload.issuedAt;
    if (age < minAge) return { ok: false as const, reason: "too_fast" };
    if (age > maxAge || age < 0) return { ok: false as const, reason: "expired" };
    return { ok: true as const };
  } catch {
    return { ok: false as const, reason: "invalid" };
  }
}

export function isProtectedForm(value: string | null): value is ProtectedForm {
  return value === "analysis" || value === "contact" || value === "signup";
}
