import type { AIProviderUsage } from "../../contracts/ai-provider";

export function normalizeOpenAIUsage(usage: { input_tokens: number; output_tokens: number; total_tokens: number } | null | undefined): AIProviderUsage {
  return { inputTokens: usage?.input_tokens ?? 0, outputTokens: usage?.output_tokens ?? 0, totalTokens: usage?.total_tokens ?? 0 };
}
