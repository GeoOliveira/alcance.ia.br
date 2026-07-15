import { z } from "zod";

export const publicSettingsSchema = z.object({
  siteName: z.string().min(2).max(80),
  contactEmail: z.email(),
  supportEmail: z.email(),
  publicUrl: z.url().refine((value) => value.startsWith("https://"), "Use uma URL HTTPS."),
  analysisEnabled: z.boolean(),
  analysisDemoMode: z.boolean(),
  signupEnabled: z.boolean(),
  maintenanceEnabled: z.boolean(),
  maintenanceTitle: z.string().min(3).max(120),
  maintenanceMessage: z.string().min(10).max(500),
  ga4Enabled: z.boolean(),
  ga4MeasurementId: z.string().regex(/^$|^G-[A-Z0-9]+$/),
  clarityEnabled: z.boolean(),
  clarityProjectId: z.string().regex(/^$|^[a-z0-9]+$/i),
  analyticsEnvironment: z.enum(["all", "production", "preview", "development"]),
  cookieConsentVersion: z.string().min(1).max(20),
  policyVersion: z.string().min(1).max(30),
});

export type PublicSettings = z.infer<typeof publicSettingsSchema>;

export const settingSchemas: Record<string, z.ZodType> = {
  "general.site_name": z.string().min(2).max(80),
  "general.contact_email": z.email(),
  "general.support_email": z.email(),
  "general.public_url": z.url().refine((value) => value.startsWith("https://"), "Use uma URL HTTPS."),
  "analysis.enabled": z.boolean(),
  "analysis.demo_mode": z.boolean(),
  "analysis.daily_limit": z.number().int().min(1).max(100000),
  "analysis.profile_cache_hours": z.number().int().min(1).max(720),
  "analysis.anonymous_retention_days": z.number().int().min(1).max(365),
  "analysis.maximum_posts": z.number().int().min(1).max(100),
  "analysis.engagement_max_posts": z.number().int().min(3).max(100),
  "analysis.engagement_max_age_days": z.number().int().min(7).max(365),
  "analysis.engagement_minimum_posts": z.number().int().min(3).max(12),
  "analysis.request_cooldown_minutes": z.number().int().min(0).max(1440),
  "analysis.minimum_posts_for_trend": z.number().int().min(4).max(50),
  "analysis.minimum_posts_per_format": z.number().int().min(2).max(20),
  "analysis.minimum_posts_for_caption_comparison": z.number().int().min(2).max(20),
  "analysis.trend_stable_threshold_percent": z.number().int().min(1).max(25),
  "analysis.trend_relevant_threshold_percent": z.number().int().min(10).max(100),
  "analysis.maximum_action_items": z.number().int().min(1).max(5),
  "analysis.highlights_audit_enabled": z.boolean(),
  "analysis.caption_analysis_enabled": z.boolean(),
  "analysis.hashtag_analysis_enabled": z.boolean(),
  "analysis.cta_analysis_enabled": z.boolean(),
  "signup.enabled": z.boolean(),
  "signup.google_enabled": z.boolean(),
  "signup.email_enabled": z.boolean(),
  "maintenance.enabled": z.boolean(),
  "maintenance.title": z.string().min(3).max(120),
  "maintenance.message": z.string().min(10).max(500),
  "analytics.ga4_enabled": z.boolean(),
  "analytics.ga4_measurement_id": z.string().regex(/^$|^G-[A-Z0-9]+$/),
  "analytics.clarity_enabled": z.boolean(),
  "analytics.clarity_project_id": z.string().regex(/^$|^[a-z0-9]+$/i).max(50),
  "analytics.environment": z.enum(["all", "production", "preview", "development"]),
  "privacy.cookie_consent_version": z.string().min(1).max(20),
  "privacy.policy_version": z.string().min(1).max(30),
  "scrapecreators.poc_enabled": z.boolean(),
  "scrapecreators.poc_daily_request_limit": z.number().int().min(1).max(10000),
  "scrapecreators.poc_max_pages_per_test": z.number().int().min(1).max(10),
  "scrapecreators.poc_allow_force_refresh": z.boolean(),
  "scrapecreators.poc_raw_retention_days": z.number().int().min(1).max(30),
  "scrapecreators.poc_normalized_retention_days": z.number().int().min(1).max(365),
  "scrapecreators.profile_cache_minutes": z.number().int().min(1).max(1440),
  "scrapecreators.posts_cache_minutes": z.number().int().min(1).max(1440),
  "scrapecreators.reels_cache_minutes": z.number().int().min(1).max(1440),
  "scrapecreators.post_details_cache_minutes": z.number().int().min(1).max(1440),
};

export function parseSettingInput(key: string, valueType: string, raw: string) {
  const schema = settingSchemas[key];
  if (!schema) return { success: false as const, error: "Configuração não autorizada." };
  let value: unknown = raw;
  if (valueType === "boolean") value = raw === "true";
  if (valueType === "number") value = Number(raw);
  if (valueType === "json") {
    try { value = JSON.parse(raw); } catch { return { success: false as const, error: "JSON inválido." }; }
  }
  const parsed = schema.safeParse(value);
  if (!parsed.success) return { success: false as const, error: parsed.error.issues[0]?.message ?? "Valor inválido." };
  return { success: true as const, value: parsed.data };
}
