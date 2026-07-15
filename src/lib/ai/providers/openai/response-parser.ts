import type { AIProfileAnalysisOutput } from "../../contracts/ai-analysis-output";
import { profileAnalysisOutputSchema } from "../../schemas/profile-analysis-schema";
import { OpenAIContentRefusalError, OpenAIInvalidResponseError } from "./errors";

export function parseOpenAIProfileAnalysis(value: unknown, executionId?: string, durationMs?: number): AIProfileAnalysisOutput {
  if (!value) throw new OpenAIContentRefusalError(executionId, durationMs);
  const parsed = profileAnalysisOutputSchema.safeParse(value);
  if (!parsed.success) throw new OpenAIInvalidResponseError(executionId, durationMs, { issues: parsed.error.issues.slice(0, 8).map((issue) => ({ path: issue.path.join("."), code: issue.code })) });
  return parsed.data;
}
