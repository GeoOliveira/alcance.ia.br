import type { AIProfileAnalysisInput } from "./ai-analysis-input";
import type { AIProfileAnalysisOutput } from "./ai-analysis-output";

export type AIProviderUsage = { inputTokens: number; outputTokens: number; totalTokens: number };
export type AIProviderResult = {
  output: AIProfileAnalysisOutput;
  model: string;
  providerResponseId: string | null;
  durationMs: number;
  usage: AIProviderUsage;
};

export interface AIProvider {
  generateProfileAnalysis(input: AIProfileAnalysisInput, signal?: AbortSignal): Promise<AIProviderResult>;
}
