import type { AIProfileAnalysisOutput } from "../contracts/ai-analysis-output";

const clean = (value: string) => value.replace(/<[^>]*>/g, "").replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
export function sanitizeAIAnalysisOutput(output: AIProfileAnalysisOutput): AIProfileAnalysisOutput {
  return JSON.parse(JSON.stringify(output), (_key, value: unknown) => typeof value === "string" ? clean(value) : value) as AIProfileAnalysisOutput;
}
