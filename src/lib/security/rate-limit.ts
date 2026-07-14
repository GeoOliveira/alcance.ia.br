import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { integerFromEnv } from "./http";

export type RateLimitRoute = "analysis" | "contact" | "signup" | "form-token";
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
  }): Promise<RateLimitResult>;
}

type Entry = { count: number; resetAt: number };

export class MemoryRateLimitStore implements RateLimitStore {
  private readonly buckets = new Map<string, Entry>();

  async consume({ keyHash, route, limit, windowSeconds }: Parameters<RateLimitStore["consume"]>[0]) {
    const now = Date.now();
    const key = `${route}:${keyHash}`;
    const current = this.buckets.get(key);
    if (!current || current.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
      return { allowed: true, available: true, retryAfter: 0 };
    }
    current.count += 1;
    return {
      allowed: current.count <= limit,
      available: true,
      retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }
}

const developmentStore = new MemoryRateLimitStore();

class SupabaseRateLimitStore implements RateLimitStore {
  constructor(private readonly client: NonNullable<ReturnType<typeof createAdminClient>>) {}

  async consume({ keyHash, route, limit, windowSeconds }: Parameters<RateLimitStore["consume"]>[0]) {
    const { data, error } = await this.client.rpc("consume_form_rate_limit", {
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
  }[route];
  const prefix = route.replace("-", "_").toUpperCase();
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

export async function requestFingerprint(request: Request) {
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
  const digest = await crypto.subtle.sign("HMAC", key, encoder.encode(requestIp(request)));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function checkRateLimit(
  request: Request,
  route: RateLimitRoute,
  store?: RateLimitStore,
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
  const { limit, windowSeconds } = policy(route);
  const keyHash = await requestFingerprint(request);
  if (!keyHash) return { allowed: false, available: false, retryAfter: 0 };
  return selectedStore.consume({
    keyHash,
    route,
    limit,
    windowSeconds,
  });
}
