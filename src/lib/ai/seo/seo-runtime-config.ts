import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type SeoAIRuntimeConfig = {
  enabled: boolean;
  dailyRequestLimit: number;
  cacheHours: number;
  brandVoice: string;
  requiredTerms: string[];
  forbiddenTerms: string[];
  retryEnabled: boolean;
};

const defaults: SeoAIRuntimeConfig = {
  enabled: true,
  dailyRequestLimit: 50,
  cacheHours: 24,
  brandVoice: "Profissional, claro, confiável, direto e acessível; sem exageros comerciais.",
  requiredTerms: [],
  forbiddenTerms: ["garantido", "milagre", "resultado certo"],
  retryEnabled: true,
};

function integer(value: unknown, fallback: number, min: number, max: number) {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max ? value : fallback;
}

function list(value: unknown) {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, 30);
  if (typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean).slice(0, 30);
  return [];
}

export async function getSeoAIRuntimeConfig(): Promise<SeoAIRuntimeConfig> {
  const admin = createAdminClient();
  if (!admin) return { ...defaults, enabled: false };
  const keys = ["ai.enabled", "ai.retry_enabled", "ai.seo_generation_enabled", "ai.seo_daily_request_limit", "ai.seo_cache_hours", "ai.seo_brand_voice", "ai.seo_required_terms", "ai.seo_forbidden_terms"];
  const { data, error } = await admin.from("app_settings").select("key,value").in("key", keys);
  if (error) return { ...defaults, enabled: false };
  const values = Object.fromEntries((data || []).map((row) => [row.key, row.value]));
  return {
    enabled: values["ai.enabled"] === true && values["ai.seo_generation_enabled"] !== false,
    dailyRequestLimit: integer(values["ai.seo_daily_request_limit"], defaults.dailyRequestLimit, 1, 1000),
    cacheHours: integer(values["ai.seo_cache_hours"], defaults.cacheHours, 1, 720),
    brandVoice: typeof values["ai.seo_brand_voice"] === "string" && values["ai.seo_brand_voice"].trim() ? values["ai.seo_brand_voice"].trim().slice(0, 1000) : defaults.brandVoice,
    requiredTerms: list(values["ai.seo_required_terms"]),
    forbiddenTerms: list(values["ai.seo_forbidden_terms"]).length ? list(values["ai.seo_forbidden_terms"]) : defaults.forbiddenTerms,
    retryEnabled: values["ai.retry_enabled"] !== false,
  };
}
