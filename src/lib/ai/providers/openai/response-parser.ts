import type { AIProfileAnalysisOutput } from "../../contracts/ai-analysis-output";
import { profileAnalysisOutputSchema } from "../../schemas/profile-analysis-schema";
import { OpenAIContentRefusalError, OpenAIIncompleteResponseError, OpenAIInvalidResponseError } from "./errors";

type OpenAIResponseState = {
  status?: string | null;
  incompleteReason?: string | null;
  hasRefusal?: boolean;
};

export function parseOpenAIProfileAnalysis(value: unknown, executionId?: string, durationMs?: number, state: OpenAIResponseState = {}): AIProfileAnalysisOutput {
  if (state.hasRefusal) throw new OpenAIContentRefusalError(executionId, durationMs);
  if (state.status === "incomplete") throw new OpenAIIncompleteResponseError(executionId, durationMs, state.incompleteReason);
  if (!value) throw new OpenAIInvalidResponseError(executionId, durationMs, { reason: "missing_output_parsed" });
  const parsed = profileAnalysisOutputSchema.safeParse(value);
  if (!parsed.success) throw new OpenAIInvalidResponseError(executionId, durationMs, { issues: parsed.error.issues.slice(0, 8).map((issue) => ({ path: issue.path.join("."), code: issue.code })) });
  return parsed.data;
}
