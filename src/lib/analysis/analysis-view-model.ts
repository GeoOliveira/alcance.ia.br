import type { InstagramPost } from "@/lib/social-providers/contracts/instagram-post";
import type { InstagramProfile } from "@/lib/social-providers/contracts/instagram-profile";
import { selectTopPosts } from "./analysis-metrics";
import { stageFromMetadata, stateFromRecord } from "./analysis-status";
import type { AnalysisMetrics, AnalysisObservation, AnalysisViewModel } from "./types";
import { persistedAdvancedMetricsSchema, type AdvancedAnalysisMetrics } from "./metrics";
import { engagementConfidence, type EngagementExclusionReason } from "./engagement";
import { profileAnalysisOutputSchema } from "@/lib/ai/schemas/profile-analysis-schema";

type RequestRow = { id: string; instagram_username: string; instagram_profile_url: string; status: string; created_at: string; metadata: Record<string, unknown> | null };
type ResultRow = { data_quality: string; profile_data: unknown; posts_data: unknown; metrics: unknown; observations: unknown; fetched_at: string; source_metadata: Record<string, unknown> | null; calculated_metrics?: unknown; engagement_formula_version?: string | null; engagement_calculated_at?: string | null; ai_output?: unknown; ai_visibility?: "hidden" | "preview" | "full" };
const emptyExclusions: Record<EngagementExclusionReason, number> = { missing_date: 0, outside_time_window: 0, over_post_limit: 0, missing_likes: 0, missing_comments: 0 };
function numberOrNull(value: unknown) { return typeof value === "number" && Number.isFinite(value) ? value : null; }
function normalizeMetrics(value: unknown, result: ResultRow | null): AnalysisMetrics | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const metrics = value as Partial<AnalysisMetrics>; const analyzedPosts = numberOrNull(metrics.analyzedPosts) ?? 0; const validPosts = numberOrNull(metrics.validEngagementPosts) ?? analyzedPosts;
  return {
    averageLikes: numberOrNull(metrics.averageLikes), averageComments: numberOrNull(metrics.averageComments), medianLikes: numberOrNull(metrics.medianLikes), medianComments: numberOrNull(metrics.medianComments),
    averageInteractions: numberOrNull(metrics.averageInteractions), medianInteractions: numberOrNull(metrics.medianInteractions), estimatedEngagementRate: numberOrNull(metrics.estimatedEngagementRate), estimatedTypicalEngagementRate: numberOrNull(metrics.estimatedTypicalEngagementRate),
    averageReelViews: numberOrNull(metrics.averageReelViews), analyzedPosts, validEngagementPosts: validPosts, reelsCount: numberOrNull(metrics.reelsCount) ?? 0, imagesCount: numberOrNull(metrics.imagesCount) ?? 0, carouselsCount: numberOrNull(metrics.carouselsCount) ?? 0,
    postsLast7Days: numberOrNull(metrics.postsLast7Days) ?? 0, postsLast30Days: numberOrNull(metrics.postsLast30Days) ?? 0, averageIntervalDays: numberOrNull(metrics.averageIntervalDays), followersFollowingRatio: numberOrNull(metrics.followersFollowingRatio),
    mostUsedFormat: typeof metrics.mostUsedFormat === "string" ? metrics.mostUsedFormat : null, bestObservedFormat: typeof metrics.bestObservedFormat === "string" ? metrics.bestObservedFormat : null,
    engagementLabel: typeof metrics.engagementLabel === "string" ? metrics.engagementLabel : "Dados insuficientes", engagementConfidence: metrics.engagementConfidence ?? engagementConfidence(validPosts), consistencyLabel: typeof metrics.consistencyLabel === "string" ? metrics.consistencyLabel : "Dados insuficientes", contentLabel: typeof metrics.contentLabel === "string" ? metrics.contentLabel : "Dados insuficientes",
    engagementFormulaVersion: result?.engagement_formula_version ?? metrics.engagementFormulaVersion ?? "legacy-v1", engagementCalculatedAt: result?.engagement_calculated_at ?? metrics.engagementCalculatedAt ?? result?.fetched_at ?? "", followersCountUsed: numberOrNull(metrics.followersCountUsed),
    engagementMaxPosts: numberOrNull(metrics.engagementMaxPosts) ?? analyzedPosts, engagementMaxAgeDays: numberOrNull(metrics.engagementMaxAgeDays) ?? 0, engagementExclusions: metrics.engagementExclusions ?? emptyExclusions,
    minimumInteractions: numberOrNull(metrics.minimumInteractions), maximumInteractions: numberOrNull(metrics.maximumInteractions), meanMedianRatio: numberOrNull(metrics.meanMedianRatio), topPostShare: numberOrNull(metrics.topPostShare), topThreeShare: numberOrNull(metrics.topThreeShare),
  };
}
export function buildAnalysisViewModel(request: RequestRow, result: ResultRow | null): AnalysisViewModel {
  const metadata = request.metadata || {}; const profile = result?.profile_data as InstagramProfile | null ?? null; const posts = Array.isArray(result?.posts_data) ? result.posts_data as InstagramPost[] : [];
  const state = stateFromRecord(request.status, metadata, result?.data_quality);
  const messages: Record<string, string> = { waiting: "Sua análise está na fila.", processing: "Estamos consultando e organizando os dados públicos.", completed: "Análise concluída com dados públicos disponíveis.", partial: "Parte dos dados não estava disponível; as métricas exibidas usam a amostra obtida.", insufficient_data: "A análise foi concluída, mas há poucos conteúdos recentes para conclusões mais firmes.", not_found: "Não encontramos esse perfil público no Instagram.", private: "Este perfil é privado e não oferece dados públicos suficientes.", temporary_error: "Não foi possível concluir a análise neste momento.", unavailable: "A análise está temporariamente indisponível.", demo: "Demonstração interna." };
  const advanced = persistedAdvancedMetricsSchema.safeParse(result?.calculated_metrics);
  const ai = profileAnalysisOutputSchema.safeParse(result?.ai_output);
  return { requestId: request.id, state, stage: stageFromMetadata(metadata), username: request.instagram_username, profileUrl: request.instagram_profile_url, requestedAt: request.created_at,
    analyzedAt: result?.fetched_at ?? null, profile, posts, metrics: normalizeMetrics(result?.metrics, result),
    observations: Array.isArray(result?.observations) ? result.observations as AnalysisObservation[] : [], topPosts: selectTopPosts(posts),
    isCached: result?.source_metadata?.used_cache === true, statusMessage: messages[state] || messages.temporary_error!, advancedMetrics: advanced.success ? advanced.data as unknown as AdvancedAnalysisMetrics : undefined,
    aiAnalysis: ai.success && result?.ai_visibility !== "hidden" ? ai.data : undefined, aiAnalysisVisibility: ai.success && result?.ai_visibility !== "hidden" ? result?.ai_visibility : undefined };
}
