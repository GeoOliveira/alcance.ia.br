import "server-only";
import { z } from "zod";

const envSchema = z.object({
  ENCURTA_INTEGRATION_ENABLED: z.enum(["true", "false"]).catch("false"),
  ENCURTA_API_URL: z.url().refine((value) => new URL(value).protocol === "https:").optional(),
  ENCURTA_API_KEY: z.string().min(24).optional(),
  ENCURTA_HMAC_SECRET: z.string().min(32).optional(),
  ENCURTA_INTEGRATION_SOURCE: z.string().regex(/^[a-z0-9_]+$/).catch("alcance_ia"),
  ENCURTA_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(1000).max(30000).catch(10000),
  ENCURTA_MAX_RETRIES: z.coerce.number().int().min(0).max(1).catch(1),
});

export type EncurtaConfig = ReturnType<typeof getEncurtaConfig>;

export function getEncurtaConfig() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    return {
      enabled: process.env.ENCURTA_INTEGRATION_ENABLED === "true",
      apiUrl: "https://encurta.io",
      apiKey: null,
      hmacSecret: null,
      source: "alcance_ia",
      timeoutMs: 10_000,
      maxRetries: 1,
      configured: false,
      configurationValid: false,
    };
  }
  const value = parsed.data;
  const apiUrl = (value.ENCURTA_API_URL ?? "https://encurta.io").replace(/\/$/, "");
  return {
    enabled: value.ENCURTA_INTEGRATION_ENABLED === "true",
    apiUrl,
    apiKey: value.ENCURTA_API_KEY ?? null,
    hmacSecret: value.ENCURTA_HMAC_SECRET ?? null,
    source: value.ENCURTA_INTEGRATION_SOURCE,
    timeoutMs: value.ENCURTA_REQUEST_TIMEOUT_MS,
    maxRetries: value.ENCURTA_MAX_RETRIES,
    configured: Boolean(value.ENCURTA_API_URL && value.ENCURTA_API_KEY && value.ENCURTA_HMAC_SECRET),
    configurationValid: true,
  };
}
