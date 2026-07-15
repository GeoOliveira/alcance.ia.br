import { MetaApiError } from "@/lib/meta/errors";
import { searchBrandedContent } from "@/lib/branded-content";
import { getBrandedContentProviderConfig } from "@/lib/branded-content/resolve-provider";
import { ApifyProviderError } from "@/lib/branded-content/providers/apify/errors";
import { searchQuerySchema } from "@/lib/meta/branded-content/validation";
import { accessError, checkDailyLimits, getBrandedContentRuntime, getRequestAccess, recordSearchRun } from "@/lib/meta/branded-content/runtime";

export const dynamic = "force-dynamic";
const allowed = new Set(["platform", "username", "pageUrl", "dateMin", "dateMax", "after"]);
const json = (body: unknown, status = 200, extra: HeadersInit = {}) => Response.json(body, { status, headers: { "Cache-Control": "no-store", ...extra } });

export async function GET(request: Request) {
  const url = new URL(request.url); const keys = [...url.searchParams.keys()];
  if (keys.some((key) => !allowed.has(key)) || new Set(keys).size !== keys.length) return json({ error: { code: "INVALID_PARAMETERS", message: "A pesquisa contém parâmetros não permitidos." } }, 400);
  const parsed = searchQuerySchema.safeParse(Object.fromEntries(url.searchParams.entries()));
  if (!parsed.success) return json({ error: { code: "VALIDATION_ERROR", message: "Revise os dados da pesquisa.", fields: parsed.error.flatten().fieldErrors } }, 400);
  const [runtime, access] = await Promise.all([getBrandedContentRuntime(), getRequestAccess()]); const denied = accessError(runtime, access);
  if (denied) return json({ error: { code: denied.code, message: denied.message }, preview: denied.code === "PREMIUM_REQUIRED" }, denied.status);
  const rate = await checkDailyLimits(request, runtime, access);
  if (!rate.allowed) return json({ error: { code: "RATE_LIMITED", message: "Você atingiu o limite de pesquisas. Tente novamente amanhã." } }, 429, { "Retry-After": "3600" });
  try {
    const providerConfig = await getBrandedContentProviderConfig();
    const search = await searchBrandedContent(parsed.data, { paginationEnabled: runtime.paginationEnabled, signal: request.signal, administrative: access.admin }, { config: { ...providerConfig, maximumResults: Math.min(providerConfig.maximumResults, runtime.maximumResults) } });
    const result = search.result;
    await recordSearchRun({ query: parsed.data, access, anonymousIdentifier: rate.anonymousIdentifier, status: result.response.meta.fromCache ? "cache_hit" : result.response.results.length ? search.fallbackUsed ? "completed_with_warnings" : "completed" : "empty", resultsCount: result.response.results.length, fromCache: result.response.meta.fromCache, durationMs: result.durationMs, providerMode: providerConfig.mode, providerUsed: result.provider, fallbackUsed: search.fallbackUsed, estimatedCost: result.estimatedCost, providerRunId: result.runId, providerDatasetId: result.datasetId });
    return json(access.admin && search.comparison ? { ...result.response, comparison: search.comparison } : result.response);
  } catch (error) {
    const safe = error instanceof MetaApiError || error instanceof ApifyProviderError ? error : new MetaApiError("META_PROVIDER", 502, "O serviço de pesquisa está temporariamente indisponível.", false);
    await recordSearchRun({ query: parsed.data, access, anonymousIdentifier: rate.anonymousIdentifier, status: safe.code.endsWith("TIMEOUT") ? "timed_out" : "failed", resultsCount: 0, fromCache: false, durationMs: safe.durationMs, errorCode: safe.code });
    return json({ error: { code: safe.code, message: safe.message } }, safe.status);
  }
}
