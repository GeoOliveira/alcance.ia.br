import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { integerFromEnv } from "./http";

export type RateLimitRoute = "analysis" | "contact" | "signup" | "form-token" | "feature-interest" | "whatsapp-shortener";
export type RateLimitResult = {
  allowed: boolean;
  available: boolean;
  retryAfter: number;
};

export interface RateLimitStore {
  consume(input: {
    keyHash: string;
    route: RateLimitRoute;
    limit: number;
    windowSeconds: number;
    idempotencyKeyHash?: string;
  }): Promise<RateLimitResult>;
}

type Entry = { count: number; resetAt: number };

export class MemoryRateLimitStore implements RateLimitStore {
  private readonly buckets = new Map<string, Entry>();
  private readonly idempotencyKeys = new Map<string, number>();

  async consume({ keyHash, route, limit, windowSeconds, idempotencyKeyHash }: Parameters<RateLimitStore["consume"]>[0]) {
    const now = Date.now();
    const key = `${route}:${keyHash}`;
    const idempotencyKey = idempotencyKeyHash ? `${key}:${idempotencyKeyHash}` : null;
    if (idempotencyKey) {
      const expiresAt = this.idempotencyKeys.get(idempotencyKey);
      if (expiresAt && expiresAt > now) return { allowed: true, available: true, retryAfter: 0 };
      if (expiresAt) this.idempotencyKeys.delete(idempotencyKey);
    }
    const current = this.buckets.get(key);
    if (!current || current.resetAt <= now) {
      const resetAt = now + windowSeconds * 1000;
      this.buckets.set(key, { count: 1, resetAt });
      if (idempotencyKey) this.idempotencyKeys.set(idempotencyKey, resetAt);
      return { allowed: true, available: true, retryAfter: 0 };
    }
    current.count += 1;
    const result = {
      allowed: current.count <= limit,
      available: true,
      retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
    if (result.allowed && idempotencyKey) this.idempotencyKeys.set(idempotencyKey, current.resetAt);
    return result;
  }
}

const developmentStore = new MemoryRateLimitStore();

class SupabaseRateLimitStore implements RateLimitStore {
  constructor(private readonly client: NonNullable<ReturnType<typeof createAdminClient>>) {}

  async consume({ keyHash, route, limit, windowSeconds, idempotencyKeyHash }: Parameters<RateLimitStore["consume"]>[0]) {
    const { data, error } = idempotencyKeyHash
      ? await this.client.rpc("consume_idempotent_rate_limit", {
          p_key_hash: keyHash,
          p_route: route,
          p_limit: limit,
          p_window_seconds: windowSeconds,
          p_idempotency_key_hash: idempotencyKeyHash,
        })
      : await this.client.rpc("consume_form_rate_limit", {
          p_key_hash: keyHash,
          p_route: route,
          p_limit: limit,
          p_window_seconds: windowSeconds,
        });
    const row = Array.isArray(data) ? data[0] : data;
    if (error || !row || typeof row.allowed !== "boolean") {
      return { allowed: false, available: false, retryAfter: 0 };
    }
    return {
      allowed: row.allowed,
      available: true,
      retryAfter: typeof row.retry_after === "number" ? Math.max(0, row.retry_after) : 0,
    };
  }
}

function policy(route: RateLimitRoute) {
  const defaults = {
    analysis: { limit: 6, windowSeconds: 60 },
    contact: { limit: 3, windowSeconds: 600 },
    signup: { limit: 4, windowSeconds: 600 },
    "form-token": { limit: 30, windowSeconds: 60 },
    "feature-interest": { limit: 10, windowSeconds: 60 },
    "whatsapp-shortener": { limit: 3, windowSeconds: 86_400 },
  }[route];
  const prefix = route.replaceAll("-", "_").toUpperCase();
  return {
    limit: integerFromEnv(`${prefix}_RATE_LIMIT_MAX`, defaults.limit, 1, 1000),
    windowSeconds: integerFromEnv(
      `${prefix}_RATE_LIMIT_WINDOW_SECONDS`,
      defaults.windowSeconds,
      1,
      86_400,
    ),
  };
}

export function requestIp(request: Request) {
  return (
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("cf-connecting-ip")?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

async function fingerprint(value: string) {
  const secret = process.env.RATE_LIMIT_HASH_SECRET ||
    (process.env.NODE_ENV !== "production" ? "development-only-rate-limit-key" : "");
  if (!secret) return null;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function requestFingerprint(request: Request) {
  return fingerprint(requestIp(request));
}

export async function checkRateLimit(
  request: Request,
  route: RateLimitRoute,
  store?: RateLimitStore,
  override?: { limit: number; windowSeconds: number; identity?: string; idempotencyKey?: string },
): Promise<RateLimitResult> {
  const selectedBackend = process.env.RATE_LIMIT_BACKEND ||
    (process.env.NODE_ENV === "production" ? "supabase" : "memory");
  let selectedStore = store;

  if (!selectedStore && selectedBackend === "memory") {
    if (process.env.NODE_ENV === "production") {
      return { allowed: false, available: false, retryAfter: 0 };
    }
    selectedStore = developmentStore;
  }

  if (!selectedStore && selectedBackend === "supabase") {
    const admin = createAdminClient();
    if (!admin) return { allowed: false, available: false, retryAfter: 0 };
    selectedStore = new SupabaseRateLimitStore(admin);
  }

  if (!selectedStore) return { allowed: false, available: false, retryAfter: 0 };
  const { limit, windowSeconds } = override ?? policy(route);
  const keyHash = override?.identity ? await fingerprint(override.identity) : await requestFingerprint(request);
  if (!keyHash) return { allowed: false, available: false, retryAfter: 0 };
  const idempotencyKeyHash = override?.idempotencyKey
    ? await fingerprint(`${route}:${override.idempotencyKey}`)
    : undefined;
  if (override?.idempotencyKey && !idempotencyKeyHash) return { allowed: false, available: false, retryAfter: 0 };
  return selectedStore.consume({
    keyHash,
    route,
    limit,
    windowSeconds,
    ...(idempotencyKeyHash ? { idempotencyKeyHash } : {}),
  });
}
