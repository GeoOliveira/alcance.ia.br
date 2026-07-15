import "server-only";
import OpenAI, { APIConnectionTimeoutError, APIError, AuthenticationError, RateLimitError } from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { AIProvider } from "../../contracts/ai-provider";
import { buildProfileAnalysisPrompt } from "../../prompts/prompt-builder";
import { PROFILE_ANALYSIS_PROMPT_VERSION } from "../../prompts/prompt-version";
import { profileAnalysisOutputSchema, AI_ANALYSIS_SCHEMA_VERSION } from "../../schemas/profile-analysis-schema";
import { getOpenAIConfig } from "./config";
import { OpenAIAuthenticationError, OpenAIProviderError, OpenAIRateLimitError, OpenAITimeoutError } from "./errors";
import { parseOpenAIProfileAnalysis } from "./response-parser";
import { normalizeOpenAIUsage } from "./usage";

function hasContentRefusal(output: unknown): boolean {
  if (!Array.isArray(output)) return false;
  return output.some((item) => {
    if (!item || typeof item !== "object" || !("content" in item) || !Array.isArray(item.content)) return false;
    return item.content.some((content: unknown) => content && typeof content === "object" && "type" in content && content.type === "refusal");
  });
}

export function createOpenAIProvider(executionId?: string): AIProvider {
  const config = getOpenAIConfig(executionId);
  const client = new OpenAI({ apiKey: config.apiKey, timeout: config.timeoutMs, maxRetries: 0 });
  return { async generateProfileAnalysis(input, signal) {
    const started = performance.now(); const prompt = buildProfileAnalysisPrompt(input);
    try {
      const response = await client.responses.parse({ model: config.model, instructions: prompt.instructions, input: prompt.input, max_output_tokens: config.maxOutputTokens, reasoning: { effort: config.reasoningEffort }, store: false, metadata: { execution_id: executionId || "unknown", prompt_version: PROFILE_ANALYSIS_PROMPT_VERSION, schema_version: AI_ANALYSIS_SCHEMA_VERSION }, text: { format: zodTextFormat(profileAnalysisOutputSchema, "alcance_ai_profile_analysis") } }, { signal });
      const durationMs = Math.round(performance.now() - started);
      const output = parseOpenAIProfileAnalysis(response.output_parsed, executionId, durationMs, {
        status: response.status,
        incompleteReason: response.incomplete_details?.reason,
        hasRefusal: hasContentRefusal(response.output),
      });
      return { output, model: config.model, providerResponseId: response.id || null, durationMs, usage: normalizeOpenAIUsage(response.usage) };
    } catch (error) {
      const duration = Math.round(performance.now() - started);
      if (error instanceof AuthenticationError) throw new OpenAIAuthenticationError(executionId, duration);
      if (error instanceof RateLimitError) throw new OpenAIRateLimitError(executionId, duration);
      if (error instanceof APIConnectionTimeoutError || (error instanceof DOMException && error.name === "AbortError")) throw new OpenAITimeoutError(executionId, duration);
      if (error instanceof APIError) throw new OpenAIProviderError(executionId, error.status >= 500, duration, { providerStatus: error.status, requestId: error.requestID || null });
      throw error;
    }
  } };
}
