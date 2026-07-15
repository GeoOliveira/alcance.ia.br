import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BrandedContentProviderKey, BrandedContentProviderMode } from "./contracts/search-result";
import { fallbackErrorCodes } from "./fallback-policy";

export type BrandedContentProviderConfig = { mode: BrandedContentProviderMode; primary: BrandedContentProviderKey; fallback: BrandedContentProviderKey; fallbackEnabled: boolean; fallbackOnEmpty: boolean; eligibleErrorCodes: string[]; maximumResults: number; metaCacheMinutes: number; apifyCacheMinutes: number; metaEnabled: boolean; apifyEnabled: boolean; comparisonEnabled: boolean; apifyAllowPublicUsage: boolean; apifyResultsLimit: number; apifyDailyRunLimit: number };
const defaults: BrandedContentProviderConfig = { mode: "meta_only", primary: "meta_official", fallback: "apify", fallbackEnabled: false, fallbackOnEmpty: false, eligibleErrorCodes: [...fallbackErrorCodes], maximumResults: 100, metaCacheMinutes: 15, apifyCacheMinutes: 60, metaEnabled: false, apifyEnabled: false, comparisonEnabled: false, apifyAllowPublicUsage: false, apifyResultsLimit: 25, apifyDailyRunLimit: 10 };
const settingKeys = ["branded_content.provider_mode","branded_content.primary_provider","branded_content.fallback_provider","branded_content.fallback_enabled","branded_content.fallback_on_empty","branded_content.fallback_error_codes","branded_content.maximum_results","branded_content.meta_cache_minutes","branded_content.apify_cache_minutes","branded_content.apify_results_limit","branded_content.apify_daily_run_limit","branded_content.apify_allow_public_usage","branded_content.meta_enabled","branded_content.apify_enabled","branded_content.compare_mode_enabled"];
const flagKeys = ["provider_meta_branded_content","provider_apify_branded_content","branded_content_provider_fallback","branded_content_provider_comparison"];
export async function getBrandedContentProviderConfig(): Promise<BrandedContentProviderConfig> {
  const admin = createAdminClient(); if (!admin) return defaults;
  const [settings, flags] = await Promise.all([admin.from("app_settings").select("key,value").in("key", settingKeys), admin.from("feature_flags").select("key,enabled").in("key", flagKeys)]);
  if (settings.error || flags.error) return defaults;
  const values = Object.fromEntries((settings.data || []).map((row) => [row.key, row.value])); const enabled = Object.fromEntries((flags.data || []).map((row) => [row.key, row.enabled === true]));
  const mode = ["meta_only","apify_only","automatic_fallback","admin_compare"].includes(String(values[settingKeys[0]])) ? String(values[settingKeys[0]]) as BrandedContentProviderMode : defaults.mode;
  const primary = ["meta_official","apify"].includes(String(values[settingKeys[1]])) ? String(values[settingKeys[1]]) as BrandedContentProviderKey : defaults.primary; const fallback = ["meta_official","apify"].includes(String(values[settingKeys[2]])) ? String(values[settingKeys[2]]) as BrandedContentProviderKey : defaults.fallback;
  return { mode, primary, fallback, fallbackEnabled: values[settingKeys[3]] === true && enabled.branded_content_provider_fallback, fallbackOnEmpty: values[settingKeys[4]] === true, eligibleErrorCodes: Array.isArray(values[settingKeys[5]]) ? values[settingKeys[5]].filter((value: unknown): value is string => typeof value === "string" && fallbackErrorCodes.includes(value as typeof fallbackErrorCodes[number])) : defaults.eligibleErrorCodes, maximumResults: clamp(values[settingKeys[6]], 1, 500, defaults.maximumResults), metaCacheMinutes: clamp(values[settingKeys[7]], 1, 10080, defaults.metaCacheMinutes), apifyCacheMinutes: clamp(values[settingKeys[8]], 1, 10080, defaults.apifyCacheMinutes), metaEnabled: values[settingKeys[12]] === true && enabled.provider_meta_branded_content === true, apifyEnabled: values[settingKeys[13]] === true && enabled.provider_apify_branded_content === true, comparisonEnabled: values[settingKeys[14]] === true && enabled.branded_content_provider_comparison === true, apifyAllowPublicUsage: values[settingKeys[11]] === true, apifyResultsLimit: clamp(values[settingKeys[9]], 1, 500, defaults.apifyResultsLimit), apifyDailyRunLimit: clamp(values[settingKeys[10]], 0, 10000, defaults.apifyDailyRunLimit) };
}
function clamp(value: unknown, min: number, max: number, fallback: number) { const number = Number(value); return Number.isFinite(number) ? Math.max(min, Math.min(max, Math.trunc(number))) : fallback; }
export function resolveProvider(config: BrandedContentProviderConfig, administrative: boolean) {
  if (config.primary === config.fallback && config.mode === "automatic_fallback") throw new Error("PRIMARY_EQUALS_FALLBACK");
  if (config.mode === "admin_compare" && !administrative) return { mode: "meta_only" as const, primary: "meta_official" as const, fallback: null };
  if (config.mode === "meta_only") return { mode: config.mode, primary: "meta_official" as const, fallback: null };
  if (config.mode === "apify_only") return { mode: config.mode, primary: "apify" as const, fallback: null };
  return { mode: config.mode, primary: config.primary, fallback: config.mode === "automatic_fallback" && config.fallbackEnabled ? config.fallback : null };
}
