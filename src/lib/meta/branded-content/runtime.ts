import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requestFingerprint } from "@/lib/security/rate-limit";
import type { BrandedContentSearchQuery } from "./validation";

const flags = ["resource_branded_content", "resource_branded_content_pagination", "resource_branded_content_dashboard", "resource_branded_content_ai", "resource_branded_content_history", "resource_branded_content_export", "resource_branded_content_premium_preview"] as const;
export type BrandedContentRuntime = { enabled: boolean; visible: boolean; status: string; accessLevel: "public" | "free" | "premium" | "admin"; requiresAuthentication: boolean; requiresPremium: boolean; cacheMinutes: number; maximumResults: number; paginationEnabled: boolean; indexable: boolean; beta: boolean; unavailableMessage: string; flags: Record<(typeof flags)[number], boolean> };
const disabledFlags = Object.fromEntries(flags.map((key) => [key, false])) as BrandedContentRuntime["flags"];

export async function getBrandedContentRuntime(): Promise<BrandedContentRuntime> {
  const admin = createAdminClient();
  if (!admin) return { enabled: false, visible: false, status: "development", accessLevel: "admin", requiresAuthentication: true, requiresPremium: false, cacheMinutes: 15, maximumResults: 100, paginationEnabled: false, indexable: false, beta: false, unavailableMessage: "O serviço de pesquisa ainda não foi configurado.", flags: disabledFlags };
  const [feature, featureFlags] = await Promise.all([admin.from("product_features").select("audience,status,visibility,enabled,limits,metadata").eq("key", "branded_content_search").maybeSingle(), admin.from("feature_flags").select("key,enabled").in("key", [...flags])]);
  const row = feature.data; const limits = row?.limits && typeof row.limits === "object" ? row.limits as Record<string, unknown> : {}; const metadata = row?.metadata && typeof row.metadata === "object" ? row.metadata as Record<string, unknown> : {}; const activeFlags = { ...disabledFlags };
  for (const flag of featureFlags.data || []) if (flag.key in activeFlags) activeFlags[flag.key as keyof typeof activeFlags] = flag.enabled === true;
  const accessLevel = ["public", "free", "premium", "admin"].includes(String(row?.audience)) ? row!.audience as BrandedContentRuntime["accessLevel"] : "admin";
  return { enabled: row?.enabled === true && activeFlags.resource_branded_content, visible: row?.visibility !== "hidden", status: String(row?.status || "development"), accessLevel, requiresAuthentication: metadata.requiresAuthentication === true || accessLevel !== "public", requiresPremium: metadata.requiresPremium === true || accessLevel === "premium", cacheMinutes: Math.max(1, Math.min(10080, Number(limits.cacheMinutes || 15))), maximumResults: Math.max(1, Math.min(500, Number(limits.maxItems || 100))), paginationEnabled: activeFlags.resource_branded_content_pagination && metadata.paginationEnabled !== false, indexable: metadata.indexable === true, beta: row?.status === "beta" || metadata.beta === true, unavailableMessage: typeof metadata.unavailableMessage === "string" ? metadata.unavailableMessage.slice(0, 300) : "Este recurso está temporariamente indisponível.", flags: activeFlags };
}

export async function getRequestAccess() {
  try {
    const client = await createClient(); const { data } = await client.auth.getUser(); const user = data.user;
    if (!user) return { userId: null, authenticated: false, admin: false, premium: false };
    const adminClient = createAdminClient(); const profile = adminClient ? await adminClient.from("admin_profiles").select("role,is_active").eq("user_id", user.id).maybeSingle() : null; const isAdmin = profile?.data?.is_active === true && ["super_admin", "admin"].includes(profile.data.role);
    return { userId: user.id, authenticated: true, admin: isAdmin, premium: isAdmin };
  } catch { return { userId: null, authenticated: false, admin: false, premium: false }; }
}

export function accessError(runtime: BrandedContentRuntime, access: Awaited<ReturnType<typeof getRequestAccess>>) {
  if (!runtime.enabled || !["active", "beta"].includes(runtime.status)) return { status: 503, code: "RESOURCE_DISABLED", message: runtime.unavailableMessage };
  if (runtime.accessLevel === "admin" && !access.admin) return { status: 403, code: "ADMIN_REQUIRED", message: "Este recurso está disponível somente para administradores." };
  if ((runtime.requiresPremium || runtime.accessLevel === "premium") && !access.premium) return { status: 402, code: "PREMIUM_REQUIRED", message: "O conteúdo completo deste recurso é Premium." };
  if ((runtime.requiresAuthentication || runtime.accessLevel === "free") && !access.authenticated) return { status: 401, code: "AUTHENTICATION_REQUIRED", message: "Entre na sua conta para usar este recurso." };
  return null;
}

export async function checkDailyLimits(request: Request, runtime: BrandedContentRuntime, access: Awaited<ReturnType<typeof getRequestAccess>>) {
  const admin = createAdminClient(); if (!admin) return { allowed: false, anonymousIdentifier: null, limit: 0 };
  const anonymousIdentifier = access.userId ? null : await requestFingerprint(request); if (!access.userId && !anonymousIdentifier) return { allowed: false, anonymousIdentifier: null, limit: 0 };
  const start = new Date(); start.setUTCHours(0, 0, 0, 0); const limits = await admin.from("product_features").select("limits").eq("key", "branded_content_search").maybeSingle(); const values = limits.data?.limits as Record<string, number> | null;
  const perActor = access.admin ? Number(values?.adminDailyRequests ?? 100) : access.premium ? Number(values?.premiumDailyRequests ?? 50) : access.authenticated ? Number(values?.freeDailyRequests ?? 10) : Number(values?.anonymousDailyRequests ?? 3); const globalLimit = Number(values?.dailyRequests ?? 100);
  const global = await admin.from("branded_content_search_runs").select("id", { count: "exact", head: true }).gte("created_at", start.toISOString()).neq("status", "cache_hit");
  let actor = admin.from("branded_content_search_runs").select("id", { count: "exact", head: true }).gte("created_at", start.toISOString()); actor = access.userId ? actor.eq("user_id", access.userId) : actor.eq("anonymous_identifier", anonymousIdentifier!); const actorResult = await actor;
  if (global.error || actorResult.error) return { allowed: false, anonymousIdentifier, limit: perActor };
  return { allowed: (global.count || 0) < globalLimit && (actorResult.count || 0) < perActor, anonymousIdentifier, limit: perActor };
}

export async function recordSearchRun(input: { query: BrandedContentSearchQuery; access: Awaited<ReturnType<typeof getRequestAccess>>; anonymousIdentifier: string | null; status: string; resultsCount: number; fromCache: boolean; durationMs: number; errorCode?: string; providerMode?: string; providerUsed?: "meta_official" | "apify"; fallbackUsed?: boolean; estimatedCost?: number; providerRunId?: string | null; providerDatasetId?: string | null }) {
  const admin = createAdminClient(); if (!admin) return; const identifier = input.query.username || input.query.pageUrl || ""; const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${input.query.platform}\u001f${identifier.toLowerCase()}\u001f${input.query.dateMin}\u001f${input.query.dateMax}`)); const queryHash = Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
  await admin.from("branded_content_search_runs").insert({ user_id: input.access.userId, anonymous_identifier: input.anonymousIdentifier, platform: input.query.platform, query_hash: queryHash, query_display: input.query.platform === "instagram" ? `@${identifier.replace(/^@/, "").toLowerCase()}` : identifier.slice(0, 300), date_min: input.query.dateMin, date_max: input.query.dateMax, status: input.status, results_count: input.resultsCount, pages_loaded: input.query.after ? 2 : 1, from_cache: input.fromCache, duration_ms: input.durationMs, error_code: input.errorCode || null, provider_mode: input.providerMode || "meta_only", provider_used: input.providerUsed || null, fallback_used: input.fallbackUsed === true, estimated_cost: input.estimatedCost || 0, provider_run_id: input.providerRunId || null, provider_dataset_id: input.providerDatasetId || null, expires_at: new Date(Date.now() + 30 * 86400000).toISOString() });
}
