import { createHash } from "node:crypto";
import type { AIProfileAnalysisInput } from "./contracts/ai-analysis-input";
import { AIIntegrationError } from "./providers/openai/errors";

export function hashAIAnalysisInput(input: AIProfileAnalysisInput) { return createHash("sha256").update(JSON.stringify(input)).digest("hex"); }
export async function runWithSingleRetry<T>(operation: () => Promise<T>, enabled: boolean): Promise<{ value: T; retryCount: 0 | 1 }> {
  try { return { value: await operation(), retryCount: 0 }; }
  catch (error) { if (!enabled || !(error instanceof AIIntegrationError) || !error.retryable) throw error; return { value: await operation(), retryCount: 1 }; }
}
