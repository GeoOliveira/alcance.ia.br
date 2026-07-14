const sensitiveKey = /api.?key|authorization|token|secret|cookie|signature|signed/i;
const signedHost = /(?:cdninstagram|fbcdn|supabase)/i;
export const MAX_STORED_RESPONSE_BYTES = 200_000;

export function sanitizeProviderData(value: unknown, depth = 0): unknown {
  if (depth > 12) return "[depth-limited]";
  if (Array.isArray(value)) return value.slice(0, 500).map((item) => sanitizeProviderData(item, depth + 1));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>)
    .filter(([key]) => !sensitiveKey.test(key)).slice(0, 500).map(([key, child]) => [key, sanitizeProviderData(child, depth + 1)]));
  if (typeof value === "string") {
    if (value.length > 20_000) return `${value.slice(0, 20_000)}[truncated]`;
    try { const url = new URL(value); if (signedHost.test(url.hostname) && url.search) return `${url.origin}${url.pathname}`; } catch { /* not a URL */ }
  }
  return value;
}

export function limitStoredData(value: unknown, maxBytes = MAX_STORED_RESPONSE_BYTES): unknown {
  const sanitized = sanitizeProviderData(value); const json = JSON.stringify(sanitized);
  return Buffer.byteLength(json, "utf8") <= maxBytes ? sanitized : { truncated: true, originalBytes: Buffer.byteLength(json, "utf8"), preview: json.slice(0, Math.max(0, maxBytes - 100)) };
}
