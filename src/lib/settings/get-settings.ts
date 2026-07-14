import "server-only";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { publicSettingsSchema, type PublicSettings } from "./definitions";

type SettingRow = { key: string; value: unknown };

function environmentDefaults(): PublicSettings {
  return {
    siteName: "Alcance IA",
    contactEmail: process.env.CONTACT_EMAIL || "contato@alcance.ia.br",
    supportEmail: process.env.CONTACT_EMAIL || "contato@alcance.ia.br",
    publicUrl: process.env.NEXT_PUBLIC_SITE_URL || "https://alcance.ia.br",
    analysisEnabled: true,
    analysisDemoMode: true,
    signupEnabled: false,
    maintenanceEnabled: false,
    maintenanceTitle: "Voltamos em breve",
    maintenanceMessage: "Estamos realizando melhorias para oferecer uma experiência ainda melhor.",
    ga4Enabled: Boolean(process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID),
    ga4MeasurementId: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || "",
    clarityEnabled: Boolean(process.env.NEXT_PUBLIC_CLARITY_ID),
    clarityProjectId: process.env.NEXT_PUBLIC_CLARITY_ID || "",
    analyticsEnvironment: "production",
    cookieConsentVersion: "1",
    policyVersion: "2026-07",
  };
}

const keyMap: Record<string, keyof PublicSettings> = {
  "general.site_name": "siteName",
  "general.contact_email": "contactEmail",
  "general.support_email": "supportEmail",
  "general.public_url": "publicUrl",
  "analysis.enabled": "analysisEnabled",
  "analysis.demo_mode": "analysisDemoMode",
  "signup.enabled": "signupEnabled",
  "maintenance.enabled": "maintenanceEnabled",
  "maintenance.title": "maintenanceTitle",
  "maintenance.message": "maintenanceMessage",
  "analytics.ga4_enabled": "ga4Enabled",
  "analytics.ga4_measurement_id": "ga4MeasurementId",
  "analytics.clarity_enabled": "clarityEnabled",
  "analytics.clarity_project_id": "clarityProjectId",
  "analytics.environment": "analyticsEnvironment",
  "privacy.cookie_consent_version": "cookieConsentVersion",
  "privacy.policy_version": "policyVersion",
};

export function mergePublicSettings(rows: SettingRow[], defaults = environmentDefaults()) {
  const candidate: Record<string, unknown> = { ...defaults };
  for (const row of rows) {
    const target = keyMap[row.key];
    if (target === "ga4MeasurementId" || target === "clarityProjectId") {
      if (typeof row.value === "string" && row.value.trim()) candidate[target] = row.value.trim();
      continue;
    }
    if (target) candidate[target] = row.value;
  }
  const parsed = publicSettingsSchema.safeParse(candidate);
  return parsed.success ? parsed.data : defaults;
}

export const getPublicSettings = unstable_cache(async () => {
  const defaults = environmentDefaults();
  const client = createAdminClient();
  if (!client) return defaults;
  const { data, error } = await client.from("app_settings").select("key,value").eq("is_public", true);
  if (error || !data) return defaults;
  return mergePublicSettings(data as SettingRow[], defaults);
}, ["public-settings-v1"], { tags: ["public-settings"], revalidate: 300 });
