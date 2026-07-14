import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { AdminSession } from "@/types/admin";
import type { ProviderEndpoint, ProviderResult } from "../contracts/provider-result";
import { ScrapeCreatorsError } from "./errors";
import { fetchFromScrapeCreators, normalizeInstagramHandle, normalizePostIdentifier } from "./provider";

export type PocSettings = {
  enabled: boolean; dailyLimit: number; maxPages: number; allowForceRefresh: boolean;
  rawRetentionDays: number; normalizedRetentionDays: number; cacheMinutes: Record<ProviderEndpoint, number>;
};
const defaults: PocSettings = { enabled: false, dailyLimit: 100, maxPages: 3, allowForceRefresh: false, rawRetentionDays: 7, normalizedRetentionDays: 30,
  cacheMinutes: { profile: 30, posts: 30, reels: 30, post_details: 60 } };

export async function getPocSettings(): Promise<PocSettings & { featureEnabled: boolean }> {
  const client = await createClient();
  const [settingsResult, flagResult] = await Promise.all([
    client.from("app_settings").select("key,value").like("key", "scrapecreators.%"),
    client.from("feature_flags").select("enabled").eq("key", "scrapecreators_poc").maybeSingle(),
  ]);
  const values = Object.fromEntries((settingsResult.data || []).map((row) => [row.key, row.value]));
  const n = (key: string, fallback: number) => typeof values[key] === "number" ? values[key] as number : fallback;
  const b = (key: string, fallback: boolean) => typeof values[key] === "boolean" ? values[key] as boolean : fallback;
  return { enabled: b("scrapecreators.poc_enabled", defaults.enabled), dailyLimit: n("scrapecreators.poc_daily_request_limit", defaults.dailyLimit), maxPages: n("scrapecreators.poc_max_pages_per_test", defaults.maxPages),
    allowForceRefresh: b("scrapecreators.poc_allow_force_refresh", defaults.allowForceRefresh), rawRetentionDays: n("scrapecreators.poc_raw_retention_days", defaults.rawRetentionDays), normalizedRetentionDays: n("scrapecreators.poc_normalized_retention_days", defaults.normalizedRetentionDays),
    cacheMinutes: { profile: n("scrapecreators.profile_cache_minutes", 30), posts: n("scrapecreators.posts_cache_minutes", 30), reels: n("scrapecreators.reels_cache_minutes", 30), post_details: n("scrapecreators.post_details_cache_minutes", 60) }, featureEnabled: flagResult.data?.enabled === true };
}

function normalize(endpoint: ProviderEndpoint, input: string) { return endpoint === "post_details" ? normalizePostIdentifier(input) : normalizeInstagramHandle(input); }
function cacheResult(row: Record<string, unknown>, endpoint: ProviderEndpoint, identifier: string): ProviderResult {
  const request = (row.request_metadata || {}) as ProviderResult["metadata"];
  return { endpoint, identifier, success: true, data: row.normalized_result as ProviderResult["data"], raw: row.raw_response ?? null,
    inventory: (row.field_inventory || { found: [], missing: [], null: [], unexpected: [], unknown: [] }) as ProviderResult["inventory"],
    validationIssues: (row.validation_issues || []) as ProviderResult["validationIssues"], nextCursor: null,
    metadata: { ...request, endpoint, usedCache: true, calls: 0, retries: 0, estimatedCreditCost: 0, fetchedAt: String(row.created_at) } };
}

export async function executePocTest(session: AdminSession, input: { endpoint: ProviderEndpoint; identifier: string; maxPages: number; useCache: boolean; forceRefresh: boolean; saveRaw: boolean }) {
  const settings = await getPocSettings();
  if (!settings.enabled || !settings.featureEnabled) throw new Error("A POC precisa estar ativa na configuração e na feature flag.");
  if (process.env.SCRAPECREATORS_POC_ENABLED !== "true") throw new Error("A POC está desativada no ambiente do servidor.");
  if (input.forceRefresh && !settings.allowForceRefresh) throw new Error("A atualização forçada está desativada.");
  const identifier = normalize(input.endpoint, input.identifier); const maxPages = Math.min(Math.max(1, input.maxPages), settings.maxPages);
  const admin = createAdminClient(); if (!admin) throw new Error("O armazenamento administrativo não está configurado.");
  const since = new Date(); since.setUTCHours(0, 0, 0, 0);
  const { data: todayRuns } = await admin.from("provider_test_runs").select("calls_count").eq("provider", "scrapecreators").gte("created_at", since.toISOString()).eq("used_cache", false);
  const callsToday = (todayRuns || []).reduce((sum, row) => sum + Number(row.calls_count || 0), 0);
  if (callsToday + maxPages > settings.dailyLimit) throw new Error("O limite diário da POC seria excedido por este teste.");
  if (input.useCache && !input.forceRefresh) {
    const cutoff = new Date(Date.now() - settings.cacheMinutes[input.endpoint] * 60_000).toISOString();
    const { data } = await admin.from("provider_test_runs").select("*").eq("provider", "scrapecreators").eq("endpoint", input.endpoint).eq("input_identifier", identifier).eq("status", "success").gte("created_at", cutoff).order("created_at", { ascending: false }).limit(10);
    const cached = (data || []).find((row) => Number((row.request_metadata as Record<string, unknown> | null)?.max_pages || 1) === maxPages);
    if (cached) {
      const normalizedExpires = new Date(Date.now() + settings.normalizedRetentionDays * 86_400_000).toISOString();
      const { data: cacheRun, error: cacheError } = await admin.from("provider_test_runs").insert({ created_by: session.userId, provider: "scrapecreators", platform: "instagram", endpoint: input.endpoint, input_identifier: identifier,
        status: "success", http_status: cached.http_status, duration_ms: 0, estimated_credit_cost: 0, items_count: cached.items_count, used_cache: true, calls_count: 0, retries_count: 0,
        request_metadata: { ...(cached.request_metadata as Record<string, unknown>), cache_source_run_id: cached.id, max_pages: maxPages }, normalized_result: cached.normalized_result,
        raw_response: input.saveRaw ? cached.raw_response : null, field_inventory: cached.field_inventory, validation_issues: cached.validation_issues, raw_expires_at: input.saveRaw ? cached.raw_expires_at : null, expires_at: normalizedExpires,
      }).select("id").single();
      if (cacheError || !cacheRun) throw new Error("Não foi possível registrar o uso do cache.");
      return { id: cacheRun.id as string, result: cacheResult({ ...cached, id: cacheRun.id, created_at: new Date().toISOString() }, input.endpoint, identifier), reusedExistingRun: true };
    }
  }
  const started = Date.now();
  try {
    const result = await fetchFromScrapeCreators(input.endpoint, identifier, maxPages);
    const rawExpires = new Date(Date.now() + settings.rawRetentionDays * 86_400_000).toISOString(); const normalizedExpires = new Date(Date.now() + settings.normalizedRetentionDays * 86_400_000).toISOString();
    const { data, error } = await admin.from("provider_test_runs").insert({ created_by: session.userId, provider: "scrapecreators", platform: "instagram", endpoint: input.endpoint, input_identifier: identifier,
      status: "success", http_status: result.metadata.httpStatus, duration_ms: result.metadata.durationMs, estimated_credit_cost: result.metadata.estimatedCreditCost, items_count: Array.isArray(result.data) ? result.data.length : result.data ? 1 : 0,
      used_cache: false, calls_count: result.metadata.calls, retries_count: result.metadata.retries, request_metadata: { ...result.metadata, max_pages: maxPages }, normalized_result: result.data,
      raw_response: input.saveRaw ? result.raw : null, field_inventory: result.inventory, validation_issues: result.validationIssues, raw_expires_at: input.saveRaw ? rawExpires : null, expires_at: normalizedExpires,
    }).select("id").single();
    if (error || !data) throw new Error("Não foi possível salvar a execução da POC. A migration foi aplicada?");
    return { id: data.id as string, result, reusedExistingRun: false };
  } catch (error) {
    const providerError = error instanceof ScrapeCreatorsError ? error : null;
    const partialNormalized = providerError?.details.partialNormalized ?? null; const partialRaw = providerError?.details.partialRaw ?? null; const partialItems = Array.isArray(partialNormalized) ? partialNormalized.length : 0; const completedCalls = Number(providerError?.details.completedCalls || 0); const failedRetries = Number(providerError?.details.retries || 0); const failedCalls = providerError?.httpStatus ? 1 + failedRetries : 0;
    const { data } = await admin.from("provider_test_runs").insert({ created_by: session.userId, provider: "scrapecreators", platform: "instagram", endpoint: input.endpoint, input_identifier: identifier,
      status: "failed", http_status: providerError?.httpStatus ?? null, duration_ms: providerError?.durationMs ?? Date.now() - started, estimated_credit_cost: completedCalls + failedCalls, items_count: partialItems, used_cache: false,
      calls_count: completedCalls + failedCalls, retries_count: failedRetries, request_metadata: { request_id: providerError?.requestId ?? crypto.randomUUID(), max_pages: maxPages, partial_result: partialItems > 0 }, normalized_result: partialNormalized,
      raw_response: input.saveRaw ? partialRaw : null, raw_expires_at: input.saveRaw && partialRaw ? new Date(Date.now() + settings.rawRetentionDays * 86_400_000).toISOString() : null, validation_issues: partialItems ? [{ path: "pagination", kind: "partial", received: "Falha após páginas concluídas" }] : [], error_code: providerError?.code ?? "internal_error",
      error_message: providerError?.message ?? (error instanceof Error ? error.message : "Falha interna controlada."), expires_at: new Date(Date.now() + settings.normalizedRetentionDays * 86_400_000).toISOString(),
    }).select("id").single();
    if (data?.id) return { id: data.id as string, result: null, reusedExistingRun: false };
    throw error;
  }
}

export async function listPocRuns(limit = 50) {
  const client = await createClient(); const { data, error } = await client.from("provider_test_runs").select("id,created_at,endpoint,input_identifier,status,http_status,duration_ms,estimated_credit_cost,items_count,used_cache,calls_count,retries_count,error_code,field_inventory").order("created_at", { ascending: false }).limit(Math.min(100, Math.max(1, limit)));
  if (error) return []; return data || [];
}
export async function getPocRun(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null; const client = await createClient(); const { data } = await client.from("provider_test_runs").select("*").eq("id", id).maybeSingle(); return data;
}
