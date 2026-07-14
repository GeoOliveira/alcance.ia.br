import type { InstagramPost } from "@/lib/social-providers/contracts/instagram-post";
import type { InstagramProfile } from "@/lib/social-providers/contracts/instagram-profile";
import { selectTopPosts } from "./analysis-metrics";
import { stageFromMetadata, stateFromRecord } from "./analysis-status";
import type { AnalysisMetrics, AnalysisObservation, AnalysisViewModel } from "./types";

type RequestRow = { id: string; instagram_username: string; instagram_profile_url: string; status: string; created_at: string; metadata: Record<string, unknown> | null };
type ResultRow = { data_quality: string; profile_data: unknown; posts_data: unknown; metrics: unknown; observations: unknown; fetched_at: string; source_metadata: Record<string, unknown> | null };
export function buildAnalysisViewModel(request: RequestRow, result: ResultRow | null): AnalysisViewModel {
  const metadata = request.metadata || {}; const profile = result?.profile_data as InstagramProfile | null ?? null; const posts = Array.isArray(result?.posts_data) ? result.posts_data as InstagramPost[] : [];
  const state = stateFromRecord(request.status, metadata, result?.data_quality);
  const messages: Record<string, string> = { waiting: "Sua análise está na fila.", processing: "Estamos consultando e organizando os dados públicos.", completed: "Análise concluída com dados públicos disponíveis.", partial: "Parte dos dados não estava disponível; as métricas exibidas usam a amostra obtida.", insufficient_data: "A análise foi concluída, mas há poucos conteúdos recentes para conclusões mais firmes.", not_found: "Não encontramos esse perfil público no Instagram.", private: "Este perfil é privado e não oferece dados públicos suficientes.", temporary_error: "Não foi possível concluir a análise neste momento.", unavailable: "A análise está temporariamente indisponível.", demo: "Demonstração interna." };
  return { requestId: request.id, state, stage: stageFromMetadata(metadata), username: request.instagram_username, profileUrl: request.instagram_profile_url, requestedAt: request.created_at,
    analyzedAt: result?.fetched_at ?? null, profile, posts, metrics: result?.metrics as AnalysisMetrics | null ?? null,
    observations: Array.isArray(result?.observations) ? result.observations as AnalysisObservation[] : [], topPosts: selectTopPosts(posts),
    isCached: result?.source_metadata?.used_cache === true, statusMessage: messages[state] || messages.temporary_error! };
}
