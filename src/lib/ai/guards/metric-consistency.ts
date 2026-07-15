import type { AIProfileAnalysisInput } from "../contracts/ai-analysis-input";
import type { AIProfileAnalysisOutput } from "../contracts/ai-analysis-output";
import { AIAnalysisConsistencyError } from "../providers/openai/errors";
import { findUnsupportedClaims } from "./unsupported-claims";

const numericLiterals = (text: string) => [...text.matchAll(/(?<![\p{L}\p{N}])\d+(?:[.,]\d+)?/gu)].map((match) => match[0]!.replace(",", ".").replace(/^0+(?=\d)/, ""));
function factualNarrativeText(output: AIProfileAnalysisOutput) {
  return [output.summary.overview, output.bioAnalysis.currentBioSummary, ...output.bioAnalysis.strengths, ...output.bioAnalysis.weaknesses,
    ...output.strengths.map((item) => item.explanation), ...output.opportunities.map((item) => item.explanation)].filter((value): value is string => Boolean(value)).join(" ");
}

export function assertAIAnalysisConsistency(input: AIProfileAnalysisInput, output: AIProfileAnalysisOutput, executionId?: string) {
  const allowed = new Set(input.availableEvidenceIds);
  const referenced = [...output.strengths, ...output.opportunities, ...output.contentIdeas, ...output.actionPlanExplanation].flatMap((item) => item.evidenceMetricIds);
  const unknownEvidence = [...new Set(referenced.filter((id) => !allowed.has(id)))];
  const unsupportedClaims = findUnsupportedClaims(output);
  const allowedNumbers = new Set(numericLiterals(JSON.stringify(input)));
  const unknownNumbers = [...new Set(numericLiterals(factualNarrativeText(output)).filter((value) => !allowedNumbers.has(value)))];
  if (unknownEvidence.length || unsupportedClaims.length || unknownNumbers.length) throw new AIAnalysisConsistencyError(executionId, { unknownEvidence, unsupportedClaims, unknownNumbers });
  if (!input.profile.biography && (output.bioAnalysis.available || output.bioAnalysis.currentBioSummary !== null)) throw new AIAnalysisConsistencyError(executionId, { reason: "bio_invented_when_absent" });
  return { unknownEvidence, unsupportedClaims, unknownNumbers };
}
