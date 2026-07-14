import type { AnalysisStage, AnalysisState } from "./types";
export function stateFromRecord(status: string, metadata: Record<string, unknown>, quality?: string | null): AnalysisState {
  if (status === "pending") return "waiting"; if (status === "processing") return "processing";
  if (status === "completed") return quality === "insufficient" ? "insufficient_data" : quality === "partial" ? "partial" : "completed";
  const code = String(metadata.analysis_error_code || "");
  if (code === "not_found") return "not_found"; if (code === "private_profile") return "private"; if (code === "configuration" || code === "unavailable") return "unavailable";
  return "temporary_error";
}
export function stageFromMetadata(metadata: Record<string, unknown>): AnalysisStage {
  const stage = metadata.analysis_stage; return ["queued", "profile", "content", "metrics", "complete"].includes(String(stage)) ? stage as AnalysisStage : "queued";
}
export const analysisStageLabels: Record<AnalysisStage, string> = { queued: "Preparando a solicitação", profile: "Analisando o perfil público", content: "Carregando publicações disponíveis", metrics: "Calculando métricas determinísticas", complete: "Resultado preparado" };
