import { z } from "zod";

const confidence = z.enum(["low", "medium", "high"]);
const evidenceIds = z.array(z.string().min(1).max(100)).max(12);

export const AI_ANALYSIS_SCHEMA_VERSION = "ai-profile-analysis-v1";

export const profileAnalysisOutputSchema = z.strictObject({
  schemaVersion: z.literal(AI_ANALYSIS_SCHEMA_VERSION),
  summary: z.strictObject({
    headline: z.string().min(1).max(100),
    overview: z.string().min(1).max(900),
    primaryOpportunity: z.string().max(300).nullable(),
    confidence,
  }),
  bioAnalysis: z.strictObject({
    available: z.boolean(),
    currentBioSummary: z.string().max(400).nullable(),
    strengths: z.array(z.string().min(1).max(240)).max(4),
    weaknesses: z.array(z.string().min(1).max(240)).max(4),
    recommendedImprovements: z.array(z.string().min(1).max(280)).max(5),
    suggestedBio: z.string().max(180).nullable(),
    confidence,
  }),
  strengths: z.array(z.strictObject({
    title: z.string().min(1).max(100),
    explanation: z.string().min(1).max(420),
    evidenceMetricIds: evidenceIds,
  })).max(3),
  opportunities: z.array(z.strictObject({
    priority: z.enum(["high", "medium", "low"]),
    title: z.string().min(1).max(100),
    explanation: z.string().min(1).max(420),
    suggestedAction: z.string().min(1).max(420),
    evidenceMetricIds: evidenceIds,
    confidence,
  })).max(5),
  contentIdeas: z.array(z.strictObject({
    title: z.string().min(1).max(100),
    format: z.enum(["reel", "carousel", "image", "story", "other"]),
    objective: z.string().min(1).max(240),
    concept: z.string().min(1).max(500),
    suggestedHook: z.string().max(240).nullable(),
    suggestedCTA: z.string().max(240).nullable(),
    evidenceMetricIds: evidenceIds,
  })).max(5),
  actionPlanExplanation: z.array(z.strictObject({
    findingId: z.string().min(1).max(100),
    explanation: z.string().min(1).max(420),
    evidenceMetricIds: evidenceIds,
  })).max(5),
  limitations: z.array(z.string().min(1).max(300)).min(1).max(8),
});

export type AIProfileAnalysisOutput = z.infer<typeof profileAnalysisOutputSchema>;
