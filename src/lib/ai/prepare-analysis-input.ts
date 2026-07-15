import type { AnalysisMetrics, AnalysisObservation } from "@/lib/analysis/types";
import type { AdvancedAnalysisMetrics, ConfidenceLevel } from "@/lib/analysis/metrics";
import type { InstagramPost } from "@/lib/social-providers/contracts/instagram-post";
import type { InstagramProfile } from "@/lib/social-providers/contracts/instagram-profile";
import type { AIConfidence, AIProfileAnalysisInput } from "./contracts/ai-analysis-input";
import { aiAnalysisInputSchema } from "./schemas/input-schema";

const EMAIL = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu;
const PHONE = /(?<!\w)(?:\+?\d{1,3}[\s().-]*)?(?:\(?\d{2}\)?[\s.-]*)?\d{4,5}[\s.-]*\d{4}(?!\w)/g;
const URL = /\b(?:https?:\/\/|www\.)\S+/giu;
const MENTION = /(^|\s)@[\p{L}\p{N}._]+/gu;
export const MAX_AI_CONTENT_SAMPLE = 12;
export const MAX_AI_CAPTION_LENGTH = 400;

export function sanitizeUntrustedText(value: string | null | undefined, maxLength: number) {
  if (!value) return null;
  const clean = value.replace(EMAIL, "[email removido]").replace(PHONE, "[telefone removido]").replace(URL, "[url removida]").replace(MENTION, "$1[menção removida]").replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim();
  return clean ? clean.slice(0, maxLength) : null;
}
const confidence = (value: ConfidenceLevel | string | undefined, sample: number): AIConfidence => value === "high" ? "high" : value === "medium" ? "medium" : sample >= 6 ? "medium" : "low";
const add = (target: Record<string, string | number | boolean | null | string[] | Record<string, unknown>>, evidence: Set<string>, id: string, value: string | number | boolean | null | undefined) => { if (value !== undefined && value !== null) { target[id] = value; evidence.add(id); } };

export function prepareSanitizedAIAnalysisInput(args: { analysisId: string; profile: InstagramProfile; posts: InstagramPost[]; metrics: AnalysisMetrics; observations: AnalysisObservation[]; advancedMetrics?: AdvancedAnalysisMetrics; engagementMetricsAudited?: boolean; requestedFeatures?: Array<"summary" | "bioAnalysis" | "recommendations" | "contentIdeas" | "actionPlanExplanation"> }): AIProfileAnalysisInput {
  const { profile, metrics, advancedMetrics: advanced } = args; const evidence = new Set<string>(); const metricValues: AIProfileAnalysisInput["metrics"] = {};
  const engagementMetricsAudited = args.engagementMetricsAudited === true && metrics.engagementFormulaVersion === "engagement-v2";
  if (engagementMetricsAudited) { add(metricValues, evidence, "engagement.mean_rate", metrics.estimatedEngagementRate); add(metricValues, evidence, "engagement.median_rate", metrics.estimatedTypicalEngagementRate); add(metricValues, evidence, "engagement.classification", metrics.engagementLabel); add(metricValues, evidence, "engagement.confidence", metrics.engagementConfidence); }
  add(metricValues, evidence, "profile.completeness", advanced?.profileCompleteness?.score); add(metricValues, evidence, "profile.completeness_classification", advanced?.profileCompleteness?.classification);
  add(metricValues, evidence, "publishing.regularity", advanced?.publishingRegularity?.classification ?? metrics.consistencyLabel); add(metricValues, evidence, "trend.recent_performance", advanced?.recentTrend?.classification);
  add(metricValues, evidence, "content.diversity", advanced?.contentDiversity?.classification ?? metrics.contentLabel); add(metricValues, evidence, "content.best_format", metrics.bestObservedFormat);
  add(metricValues, evidence, "content.performance_concentration", advanced?.performanceConcentration?.topThreePercent ?? metrics.topThreeShare); add(metricValues, evidence, "caption.cta_usage", advanced?.ctaAnalysis?.percentageWithCta);
  if (advanced?.hashtagAnalysis) { metricValues["caption.hashtag_usage"] = { averagePerPost: advanced.hashtagAnalysis.averagePerPost, mostUsed: advanced.hashtagAnalysis.mostUsed.map((item) => item.hashtag).slice(0, 8) }; evidence.add("caption.hashtag_usage"); }
  const findingConfidence = confidence(advanced?.actionPlan?.[0]?.confidence.level, metrics.analyzedPosts);
  const deterministicFindings: AIProfileAnalysisInput["deterministicFindings"] = (advanced?.actionPlan || []).slice(0, 8).map((item) => ({ id: item.id, category: item.category, priority: item.priority, evidence: item.evidence.slice(0, 600), suggestedAction: item.suggestedAction.slice(0, 500), confidence: confidence(item.confidence.level, item.confidence.sampleSize) }));
  for (const item of deterministicFindings) evidence.add(item.id);
  for (const observation of args.observations.slice(0, 4)) { deterministicFindings.push({ id: `finding.${observation.id}`, category: "observed", priority: observation.tone === "attention" ? "high" : "low", evidence: observation.message.slice(0, 600), confidence: findingConfidence }); evidence.add(`finding.${observation.id}`); }
  const input: AIProfileAnalysisInput = { analysisContext: { analysisId: args.analysisId, metricsVersion: advanced?.methodology.metricsVersion || "legacy", engagementFormulaVersion: metrics.engagementFormulaVersion, engagementMetricsAudited, language: "pt-BR", postsAnalyzed: metrics.analyzedPosts, reelsAnalyzed: metrics.reelsCount, dataConfidence: confidence(engagementMetricsAudited ? metrics.engagementConfidence : undefined, metrics.analyzedPosts), requestedFeatures: args.requestedFeatures?.length ? args.requestedFeatures : ["summary"], observedPeriod: advanced?.methodology.observedWindow ? { start: advanced.methodology.observedWindow.from, end: advanced.methodology.observedWindow.to } : undefined },
    profile: { username: profile.username || undefined, displayName: sanitizeUntrustedText(profile.displayName, 120), biography: sanitizeUntrustedText(profile.biography, 500), category: sanitizeUntrustedText(profile.category, 120), isVerified: profile.isVerified, isPrivate: profile.isPrivate, hasExternalLink: Boolean(profile.externalUrl), followersCount: profile.followersCount, followingCount: profile.followingCount, postsCount: profile.postsCount }, metrics: metricValues, deterministicFindings: deterministicFindings.slice(0, 12),
    contentSample: args.posts.slice(0, MAX_AI_CONTENT_SAMPLE).map((post) => ({ mediaType: post.mediaType, captionExcerpt: sanitizeUntrustedText(post.caption, MAX_AI_CAPTION_LENGTH), publishedAt: post.publishedAt, likeCount: post.likeCount, commentCount: post.commentCount, viewCount: post.playCount ?? post.viewCount, relativePerformance: null })), availableEvidenceIds: [...evidence].sort() };
  return aiAnalysisInputSchema.parse(JSON.parse(JSON.stringify(input))) as AIProfileAnalysisInput;
}
