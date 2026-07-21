import "server-only";
import OpenAI, { APIConnectionTimeoutError, APIError, AuthenticationError, RateLimitError } from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { getOpenAIConfig } from "@/lib/ai/providers/openai/config";
import {
  OpenAIAuthenticationError,
  OpenAIContentRefusalError,
  OpenAIIncompleteResponseError,
  OpenAIInvalidResponseError,
  OpenAIProviderError,
  OpenAIRateLimitError,
  OpenAITimeoutError,
} from "@/lib/ai/providers/openai/errors";
import { normalizeOpenAIUsage } from "@/lib/ai/providers/openai/usage";
import type { AIProviderUsage } from "@/lib/ai/contracts/ai-provider";
import { SEO_GENERATION_PROMPT_VERSION } from "./seo-generation-prompt";
import { SEO_GENERATION_SCHEMA_VERSION, seoGenerationOutputSchema, type SeoGenerationOutput } from "./seo-generation-schema";

type SeoProviderResult = {
  output: SeoGenerationOutput;
  model: string;
  providerResponseId: string | null;
  durationMs: number;
  usage: AIProviderUsage;
};

function hasRefusal(output: unknown): boolean {
  if (!Array.isArray(output)) return false;
  return output.some((item) => item && typeof item === "object" && "content" in item && Array.isArray(item.content)
    && item.content.some((content: unknown) => content && typeof content === "object" && "type" in content && content.type === "refusal"));
}

export async function generateSeoWithOpenAI(
  prompt: { instructions: string; input: string },
  executionId: string,
  signal?: AbortSignal,
): Promise<SeoProviderResult> {
  const config = getOpenAIConfig(executionId);
  const client = new OpenAI({ apiKey: config.apiKey, timeout: config.timeoutMs, maxRetries: 0 });
  const started = performance.now();
  try {
    const response = await client.responses.parse({
      model: config.model,
      instructions: prompt.instructions,
      input: prompt.input,
      max_output_tokens: Math.min(config.maxOutputTokens, 2500),
      reasoning: { effort: config.reasoningEffort },
      store: false,
      metadata: { execution_id: executionId, prompt_version: SEO_GENERATION_PROMPT_VERSION, schema_version: SEO_GENERATION_SCHEMA_VERSION },
      text: { format: zodTextFormat(seoGenerationOutputSchema, "alcance_ai_page_seo") },
    }, { signal });
    const durationMs = Math.round(performance.now() - started);
    if (hasRefusal(response.output)) throw new OpenAIContentRefusalError(executionId, durationMs);
    if (response.status === "incomplete") throw new OpenAIIncompleteResponseError(executionId, durationMs, response.incomplete_details?.reason);
    const parsed = seoGenerationOutputSchema.safeParse(response.output_parsed);
    if (!parsed.success) throw new OpenAIInvalidResponseError(executionId, durationMs, { issues: parsed.error.issues.slice(0, 8).map((issue) => issue.code) });
    return { output: parsed.data, model: config.model, providerResponseId: response.id || null, durationMs, usage: normalizeOpenAIUsage(response.usage) };
  } catch (error) {
    const durationMs = Math.round(performance.now() - started);
    if (error instanceof OpenAIContentRefusalError || error instanceof OpenAIIncompleteResponseError || error instanceof OpenAIInvalidResponseError) throw error;
    if (error instanceof AuthenticationError) throw new OpenAIAuthenticationError(executionId, durationMs);
    if (error instanceof RateLimitError) throw new OpenAIRateLimitError(executionId, durationMs);
    if (error instanceof APIConnectionTimeoutError || (error instanceof DOMException && error.name === "AbortError")) throw new OpenAITimeoutError(executionId, durationMs);
    if (error instanceof APIError) throw new OpenAIProviderError(executionId, error.status >= 500, durationMs, { providerStatus: error.status, requestId: error.requestID || null });
    throw error;
  }
}
