import "server-only";
import { ApifyClient } from "apify-client";
import { z } from "zod";

const configSchema = z.object({
  token: z.string().min(10),
  baseUrl: z.string().url().refine((value) => new URL(value).protocol === "https:"),
  actorId: z.string().regex(/^[a-zA-Z0-9_-]+\/[a-zA-Z0-9_-]+$/),
  timeoutMs: z.number().int().min(5_000).max(300_000),
  enabled: z.boolean(),
});

export class ApifyConfigurationError extends Error { readonly code = "APIFY_CONFIGURATION"; }

export function getApifyBrandCollaborationConfig() {
  const parsed = configSchema.safeParse({
    token: process.env.APIFY_API_TOKEN || "",
    baseUrl: process.env.APIFY_API_BASE_URL || "https://api.apify.com",
    actorId: process.env.APIFY_BRAND_COLLABORATION_ACTOR_ID || "apify/brand-collaboration-scraper",
    timeoutMs: Number(process.env.APIFY_BRAND_COLLABORATION_TIMEOUT_MS || 90_000),
    enabled: process.env.APIFY_BRAND_COLLABORATION_ENABLED === "true",
  });
  if (!parsed.success || !parsed.data.enabled) throw new ApifyConfigurationError("Apify não configurada.");
  return parsed.data;
}

let client: ApifyClient | null = null;
let signature = "";
export function getApifyClient() {
  const config = getApifyBrandCollaborationConfig();
  const nextSignature = `${config.baseUrl}\u001f${config.token}`;
  if (!client || signature !== nextSignature) {
    client = new ApifyClient({ token: config.token, baseUrl: config.baseUrl, timeoutSecs: Math.ceil(config.timeoutMs / 1000), maxRetries: 1 });
    signature = nextSignature;
  }
  return { client, config };
}

export function isApifyConfigured() { try { getApifyBrandCollaborationConfig(); return true; } catch { return false; } }
