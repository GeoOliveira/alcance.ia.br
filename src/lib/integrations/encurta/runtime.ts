import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { EncurtaAccessLevel } from "./types";

export type ShortenerRequestAccess = { userId: string | null; level: EncurtaAccessLevel };

export async function getShortenerRequestAccess(): Promise<ShortenerRequestAccess> {
  try {
    const client = await createClient();
    const { data } = await client.auth.getUser();
    if (!data.user) return { userId: null, level: "anonymous" };
    const admin = createAdminClient();
    const profile = admin ? await admin.from("admin_profiles").select("role,is_active").eq("user_id", data.user.id).maybeSingle() : null;
    const isAdmin = profile?.data?.is_active === true && ["super_admin", "admin"].includes(profile.data.role);
    return { userId: data.user.id, level: isAdmin ? "admin" : "free" };
  } catch {
    return { userId: null, level: "anonymous" };
  }
}

const settingKeys = [
  "whatsapp_link_shortener.anonymous_daily_limit",
  "whatsapp_link_shortener.free_daily_limit",
  "whatsapp_link_shortener.premium_daily_limit",
  "whatsapp_link_shortener.admin_daily_limit",
  "whatsapp_link_shortener.fallback_enabled",
] as const;

function boundedInteger(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 100_000 ? parsed : fallback;
}

export async function getShortenerRuntimeSettings(level: EncurtaAccessLevel) {
  const defaults = { anonymous: 3, public: 3, free: 10, premium: 100, admin: 1000 } as const;
  const admin = createAdminClient();
  if (!admin) return { available: false, dailyLimit: 0, fallbackEnabled: true };
  const { data, error } = await admin.from("app_settings").select("key,value").in("key", [...settingKeys]);
  if (error) return { available: false, dailyLimit: 0, fallbackEnabled: true };
  const settings = new Map((data || []).map((row) => [row.key, row.value]));
  const tier = level === "public" ? "anonymous" : level;
  return {
    available: true,
    dailyLimit: boundedInteger(settings.get(`whatsapp_link_shortener.${tier}_daily_limit`), defaults[level]),
    fallbackEnabled: settings.get("whatsapp_link_shortener.fallback_enabled") !== false && settings.get("whatsapp_link_shortener.fallback_enabled") !== "false",
  };
}
