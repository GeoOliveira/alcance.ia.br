import "server-only";
import { z } from "zod";
import { MetaConfigurationError } from "./errors";

const schema = z.object({ url: z.string().url().refine((value) => new URL(value).protocol === "https:"), version: z.string().regex(/^v\d+\.\d+$/), token: z.string().min(20), timeoutMs: z.number().int().min(1000).max(60000) });
export const DEFAULT_META_GRAPH_API_VERSION = "v25.0";
export function getMetaConfig() {
  const parsed = schema.safeParse({ url: process.env.META_GRAPH_API_URL || "https://graph.facebook.com", version: process.env.META_GRAPH_API_VERSION || DEFAULT_META_GRAPH_API_VERSION, token: process.env.META_ACCESS_TOKEN || "", timeoutMs: Number(process.env.META_BRANDED_CONTENT_TIMEOUT_MS || 15000) });
  if (!parsed.success) throw new MetaConfigurationError();
  return parsed.data;
}
export function isMetaConfigured() { try { getMetaConfig(); return true; } catch { return false; } }
