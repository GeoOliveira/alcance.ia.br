import type { AIProfileAnalysisOutput } from "../contracts/ai-analysis-output";
import type { AIFeatureFlags, AIRuntimeConfig } from "../runtime-config";

export function filterAIOutputByFeatures(output: AIProfileAnalysisOutput, flags: AIFeatureFlags, config: AIRuntimeConfig): AIProfileAnalysisOutput {
  return { ...output,
    summary: flags.profileSummary ? output.summary : { headline: "Interpretação assistida", overview: "Consulte as seções habilitadas abaixo.", primaryOpportunity: null, confidence: "low" },
    bioAnalysis: flags.bioAnalysis ? output.bioAnalysis : { available: false, currentBioSummary: null, strengths: [], weaknesses: [], recommendedImprovements: [], suggestedBio: null, confidence: "low" },
    strengths: flags.recommendations ? output.strengths : [],
    opportunities: flags.recommendations ? output.opportunities.slice(0, config.maximumRecommendations) : [],
    contentIdeas: flags.contentIdeas ? output.contentIdeas.slice(0, config.maximumContentIdeas) : [],
    actionPlanExplanation: flags.actionPlanExplanation ? output.actionPlanExplanation : [],
  };
}
