type Entry = { count: number; resetAt: number };
const buckets = new Map<string, Entry>();

export function checkRateLimit(key: string, limit = 5, windowMs = 60_000) {
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfter: 0 };
  }
  current.count += 1;
  return { allowed: current.count <= limit, retryAfter: Math.ceil((current.resetAt - now) / 1000) };
}

export function requestFingerprint(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  let hash = 2166136261;
  for (const char of forwarded) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return `request:${(hash >>> 0).toString(36)}`;
}
