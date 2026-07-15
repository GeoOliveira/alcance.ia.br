import { describe, expect, it } from "vitest";
import type { AIProfileAnalysisInput } from "../contracts/ai-analysis-input";
import type { AIProfileAnalysisOutput } from "../contracts/ai-analysis-output";
import { AI_ANALYSIS_SCHEMA_VERSION, profileAnalysisOutputSchema } from "../schemas/profile-analysis-schema";
import { AIAnalysisConsistencyError } from "../providers/openai/errors";
import { assertAIAnalysisConsistency } from "./metric-consistency";

const input: AIProfileAnalysisInput = { analysisContext: { analysisId: "11111111-1111-4111-8111-111111111111", metricsVersion: "v2.0.0", engagementFormulaVersion: "engagement-v2", engagementMetricsAudited: false, language: "pt-BR", postsAnalyzed: 6, reelsAnalyzed: 2, dataConfidence: "medium", requestedFeatures: ["summary"] }, profile: { biography: null }, metrics: { "content.best_format": "Reels" }, deterministicFindings: [], contentSample: [], availableEvidenceIds: ["content.best_format"] };
const valid: AIProfileAnalysisOutput = { schemaVersion: AI_ANALYSIS_SCHEMA_VERSION, summary: { headline: "Leitura da amostra", overview: "Os Reels se destacaram na amostra observada.", primaryOpportunity: null, confidence: "medium" }, bioAnalysis: { available: false, currentBioSummary: null, strengths: [], weaknesses: [], recommendedImprovements: [], suggestedBio: null, confidence: "low" }, strengths: [{ title: "Formato observado", explanation: "Reels tiveram melhor resultado na amostra.", evidenceMetricIds: ["content.best_format"] }], opportunities: [], contentIdeas: [], actionPlanExplanation: [], limitations: ["A amostra não representa todo o histórico."] };

describe("AI output validation and consistency", () => {
  it("accepts the strict schema", () => expect(profileAnalysisOutputSchema.safeParse(valid).success).toBe(true));
  it("rejects arbitrary properties", () => expect(profileAnalysisOutputSchema.safeParse({ ...valid, arbitrary: true }).success).toBe(false));
  it("rejects invented evidence identifiers", () => expect(() => assertAIAnalysisConsistency(input, { ...valid, strengths: [{ ...valid.strengths[0]!, evidenceMetricIds: ["invented.metric"] }] })).toThrow(AIAnalysisConsistencyError));
  it("rejects a current bio invented for an absent bio", () => expect(() => assertAIAnalysisConsistency(input, { ...valid, bioAnalysis: { ...valid.bioAnalysis, available: true, currentBioSummary: "Bio existente" } })).toThrow(/consistência/i));
  it("rejects unsupported claims", () => expect(() => assertAIAnalysisConsistency(input, { ...valid, summary: { ...valid.summary, overview: "O perfil tem seguidores falsos." } })).toThrow(AIAnalysisConsistencyError));
  it("allows an explicit limitation about unavailable private data", () => expect(() => assertAIAnalysisConsistency(input, { ...valid, limitations: ["Sem acesso ao Instagram Insights, a leitura usa apenas a amostra pública."] })).not.toThrow());
  it("rejects numerical values that do not exist in the input package", () => expect(() => assertAIAnalysisConsistency(input, { ...valid, summary: { ...valid.summary, overview: "A taxa observada foi de 99%." } })).toThrow(AIAnalysisConsistencyError));
  it("allows editorial numbers in a suggested content idea", () => expect(() => assertAIAnalysisConsistency(input, { ...valid, contentIdeas: [{ title: "Três aprendizados", format: "carousel", objective: "Ensinar", concept: "Apresente 3 aprendizados em sequência.", suggestedHook: null, suggestedCTA: null, evidenceMetricIds: ["content.best_format"] }] })).not.toThrow());
});
