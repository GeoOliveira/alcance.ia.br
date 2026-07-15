export type AIConfidence = "low" | "medium" | "high";

export type AIProfileAnalysisInput = {
  analysisContext: {
    analysisId: string;
    metricsVersion: string;
    engagementFormulaVersion: string;
    engagementMetricsAudited: boolean;
    language: "pt-BR";
    postsAnalyzed: number;
    reelsAnalyzed: number;
    dataConfidence: AIConfidence;
    requestedFeatures: string[];
    observedPeriod?: { start: string | null; end: string | null };
  };
  profile: {
    username?: string;
    displayName?: string | null;
    biography?: string | null;
    category?: string | null;
    isVerified?: boolean | null;
    isPrivate?: boolean | null;
    hasExternalLink?: boolean | null;
    followersCount?: number | null;
    followingCount?: number | null;
    postsCount?: number | null;
  };
  metrics: Record<string, string | number | boolean | null | string[] | Record<string, unknown>>;
  deterministicFindings: Array<{
    id: string;
    category: string;
    priority: "high" | "medium" | "low";
    evidence: string;
    suggestedAction?: string;
    confidence: AIConfidence;
  }>;
  contentSample: Array<{
    mediaType: string;
    captionExcerpt?: string | null;
    publishedAt?: string | null;
    likeCount?: number | null;
    commentCount?: number | null;
    viewCount?: number | null;
    relativePerformance?: string | null;
  }>;
  availableEvidenceIds: string[];
};
