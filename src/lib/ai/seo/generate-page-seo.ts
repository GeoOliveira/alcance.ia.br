import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { getConfiguredModelName, isOpenAIConfigured } from "@/lib/ai/providers/openai/config";
import { AIIntegrationError, OpenAIInvalidResponseError } from "@/lib/ai/providers/openai/errors";
import { runWithSingleRetry } from "@/lib/ai/execution-utils";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCatalogPage } from "@/lib/seo/page-catalog";
import { pageSeoBriefDefaults } from "./page-brief-defaults";
import { generateSeoWithOpenAI } from "./openai-seo-provider";
import { buildSeoGenerationPrompt, SEO_GENERATION_PROMPT_VERSION } from "./seo-generation-prompt";
import { getSeoAIRuntimeConfig } from "./seo-runtime-config";
import { SEO_GENERATION_SCHEMA_VERSION, sanitizeSeoGenerationOutput, seoGenerationOutputSchema, type SeoGenerationRequest } from "./seo-generation-schema";

export async function generatePageSeo(request: SeoGenerationRequest, requestedBy: string) {
  const executionId = randomUUID();
  const admin = createAdminClient();
  if (!admin) return { ok: false as const, code: "unavailable", executionId };
  const runtime = await getSeoAIRuntimeConfig();
  if (!runtime.enabled) return { ok: false as const, code: "disabled", executionId };
  if (!isOpenAIConfigured()) return { ok: false as const, code: "configuration", executionId };

  const page = getCatalogPage(request.pageKey);
  const model = getConfiguredModelName();
  if (!model) return { ok: false as const, code: "configuration", executionId };
  const inputSnapshot = {
    pageKey: request.pageKey,
    brief: pageSeoBriefDefaults[request.pageKey],
    additionalGuidance: request.additionalGuidance,
    current: request.current,
    brand: { voice: runtime.brandVoice, requiredTerms: runtime.requiredTerms, forbiddenTerms: runtime.forbiddenTerms },
  };
  const inputHash = createHash("sha256").update(JSON.stringify(inputSnapshot)).digest("hex");
  const runBase = {
    id: executionId,
    page_key: page.key,
    provider: "openai",
    model,
    prompt_version: SEO_GENERATION_PROMPT_VERSION,
    schema_version: SEO_GENERATION_SCHEMA_VERSION,
    input_hash: inputHash,
    input_snapshot: inputSnapshot,
    requested_by: requestedBy,
    started_at: new Date().toISOString(),
  };

  if (!request.bypassCache) {
    const cutoff = new Date(Date.now() - runtime.cacheHours * 3_600_000).toISOString();
    const { data: cached } = await admin.from("ai_seo_generation_runs").select("id,output_snapshot").eq("page_key", page.key).eq("input_hash", inputHash).eq("model", model).eq("prompt_version", SEO_GENERATION_PROMPT_VERSION).eq("schema_version", SEO_GENERATION_SCHEMA_VERSION).eq("status", "completed").gte("created_at", cutoff).order("created_at", { ascending: false }).limit(1).maybeSingle();
    const cachedOutput = seoGenerationOutputSchema.safeParse(cached?.output_snapshot);
    if (cached && cachedOutput.success) return { ok: true as const, cached: true, executionId: cached.id, output: cachedOutput.data };
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const { count } = await admin.from("ai_seo_generation_runs").select("id", { count: "exact", head: true }).gte("created_at", today.toISOString());
  if ((count || 0) >= runtime.dailyRequestLimit) {
    await admin.from("ai_seo_generation_runs").insert({ ...runBase, status: "failed", error_code: "daily_limit", error_message: "Limite diário de geração SEO atingido.", completed_at: new Date().toISOString() });
    return { ok: false as const, code: "daily_limit", executionId };
  }

  const { error: insertError } = await admin.from("ai_seo_generation_runs").insert({ ...runBase, status: "processing" });
  if (insertError) return { ok: false as const, code: "deduplicated", executionId };
  try {
    const prompt = buildSeoGenerationPrompt(page, pageSeoBriefDefaults[page.key], request, inputSnapshot.brand);
    const attempt = await runWithSingleRetry(() => generateSeoWithOpenAI(prompt, executionId), runtime.retryEnabled);
    const output = sanitizeSeoGenerationOutput(attempt.value.output);
    const validatedOutput = seoGenerationOutputSchema.safeParse(output);
    if (!validatedOutput.success) throw new OpenAIInvalidResponseError(executionId, attempt.value.durationMs, { reason: "invalid_sanitized_output" });
    await admin.from("ai_seo_generation_runs").update({
      status: "completed",
      output_snapshot: validatedOutput.data,
      provider_response_id: attempt.value.providerResponseId,
      input_tokens: attempt.value.usage.inputTokens,
      output_tokens: attempt.value.usage.outputTokens,
      total_tokens: attempt.value.usage.totalTokens,
      duration_ms: attempt.value.durationMs,
      retry_count: attempt.retryCount,
      completed_at: new Date().toISOString(),
    }).eq("id", executionId);
    return { ok: true as const, cached: false, executionId, output: validatedOutput.data };
  } catch (caught) {
    const error = caught instanceof AIIntegrationError ? caught : null;
    await admin.from("ai_seo_generation_runs").update({
      status: error?.retryable ? "retryable_failed" : "failed",
      error_code: error?.code || "unexpected_error",
      error_message: error?.message || "Falha inesperada na geração de SEO.",
      duration_ms: error?.durationMs || null,
      completed_at: new Date().toISOString(),
    }).eq("id", executionId);
    return { ok: false as const, code: error?.code || "unexpected_error", executionId };
  }
}
