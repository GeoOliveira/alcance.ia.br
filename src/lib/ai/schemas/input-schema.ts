import { z } from "zod";

export const aiAnalysisInputSchema = z.strictObject({
  analysisContext: z.strictObject({
    analysisId: z.string().uuid(), metricsVersion: z.string().min(1).max(30), engagementFormulaVersion: z.string().min(1).max(40), engagementMetricsAudited: z.boolean(), language: z.literal("pt-BR"), postsAnalyzed: z.number().int().min(0).max(100), reelsAnalyzed: z.number().int().min(0).max(100), dataConfidence: z.enum(["low", "medium", "high"]), requestedFeatures: z.array(z.enum(["summary","bioAnalysis","recommendations","contentIdeas","actionPlanExplanation"])).min(1).max(5), observedPeriod: z.strictObject({ start: z.string().nullable(), end: z.string().nullable() }).optional(),
  }),
  profile: z.strictObject({ username: z.string().max(40).optional(), displayName: z.string().max(120).nullable().optional(), biography: z.string().max(500).nullable().optional(), category: z.string().max(120).nullable().optional(), isVerified: z.boolean().nullable().optional(), isPrivate: z.boolean().nullable().optional(), hasExternalLink: z.boolean().nullable().optional(), followersCount: z.number().int().min(0).nullable().optional(), followingCount: z.number().int().min(0).nullable().optional(), postsCount: z.number().int().min(0).nullable().optional() }),
  metrics: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(z.string()), z.record(z.string(), z.unknown())])),
  deterministicFindings: z.array(z.strictObject({ id: z.string().min(1).max(100), category: z.string().min(1).max(60), priority: z.enum(["high", "medium", "low"]), evidence: z.string().min(1).max(600), suggestedAction: z.string().max(500).optional(), confidence: z.enum(["low", "medium", "high"]) })).max(12),
  contentSample: z.array(z.strictObject({ mediaType: z.string().max(30), captionExcerpt: z.string().max(500).nullable().optional(), publishedAt: z.string().nullable().optional(), likeCount: z.number().min(0).nullable().optional(), commentCount: z.number().min(0).nullable().optional(), viewCount: z.number().min(0).nullable().optional(), relativePerformance: z.string().max(40).nullable().optional() })).max(12),
  availableEvidenceIds: z.array(z.string().min(1).max(100)).max(50),
});
