import type { AIProfileAnalysisInput } from "../contracts/ai-analysis-input";
import type { AIProfileAnalysisOutput } from "../contracts/ai-analysis-output";
import { AIAnalysisConsistencyError } from "../providers/openai/errors";
import { findUnsupportedClaims } from "./unsupported-claims";

const numericLiterals = (text: string) => [...text.matchAll(/(?<![\p{L}\p{N}])\d+(?:[.,]\d+)?/gu)].map((match) => match[0]!.replace(",", ".").replace(/^0+(?=\d)/, ""));
function narrativeText(output: AIProfileAnalysisOutput) {
  return [output.summary.headline, output.summary.overview, output.summary.primaryOpportunity, output.bioAnalysis.currentBioSummary, ...output.bioAnalysis.strengths, ...output.bioAnalysis.weaknesses, ...output.bioAnalysis.recommendedImprovements, output.bioAnalysis.suggestedBio,
    ...output.strengths.flatMap((item) => [item.title, item.explanation]), ...output.opportunities.flatMap((item) => [item.title, item.explanation, item.suggestedAction]), ...output.contentIdeas.flatMap((item) => [item.title, item.objective, item.concept, item.suggestedHook, item.suggestedCTA]), ...output.actionPlanExplanation.map((item) => item.explanation), ...output.limitations].filter((value): value is string => Boolean(value)).join(" ");
}

export function assertAIAnalysisConsistency(input: AIProfileAnalysisInput, output: AIProfileAnalysisOutput, executionId?: string) {
  const allowed = new Set(input.availableEvidenceIds);
  const referenced = [...output.strengths, ...output.opportunities, ...output.contentIdeas, ...output.actionPlanExplanation].flatMap((item) => item.evidenceMetricIds);
  const unknownEvidence = [...new Set(referenced.filter((id) => !allowed.has(id)))];
  const unsupportedClaims = findUnsupportedClaims(output);
  const allowedNumbers = new Set(numericLiterals(JSON.stringify(input)));
  const unknownNumbers = [...new Set(numericLiterals(narrativeText(output)).filter((value) => !allowedNumbers.has(value)))];
  if (unknownEvidence.length || unsupportedClaims.length || unknownNumbers.length) throw new AIAnalysisConsistencyError(executionId, { unknownEvidence, unsupportedClaims, unknownNumbers });
  if (!input.profile.biography && (output.bioAnalysis.available || output.bioAnalysis.currentBioSummary !== null)) throw new AIAnalysisConsistencyError(executionId, { reason: "bio_invented_when_absent" });
  return { unknownEvidence, unsupportedClaims, unknownNumbers };
}
