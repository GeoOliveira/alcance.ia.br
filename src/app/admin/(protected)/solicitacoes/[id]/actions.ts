"use server";

import { revalidatePath } from "next/cache";
import { authorizeAdminAction } from "@/lib/admin/auth";
import { writeAudit } from "@/lib/admin/audit";
import { recalculateAnalysisMetrics } from "@/lib/analysis/recalculate-analysis";
import type { ActionState } from "@/types/admin";

export async function recalculateMetricsAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try { await authorizeAdminAction("analysis.manage"); } catch { return { ok: false, message: "Você não possui permissão para recalcular métricas." }; }
  const id = String(formData.get("id") || "");
  await writeAudit({ action: "analysis_recalculate_requested", entityType: "analysis_request", entityId: id, metadata: { external_calls: 0 } });
  const result = await recalculateAnalysisMetrics(id);
  if (!result.ok) return { ok: false, message: result.code === "normalized_data_unavailable" ? "Os dados normalizados desta análise não estão disponíveis." : "Não foi possível recalcular as métricas." };
  await writeAudit({ action: "analysis_metrics_recalculated", entityType: "analysis_request", entityId: id, before: { metrics_version: result.previousVersion }, after: { metrics_version: result.version }, metadata: { posts_considered: result.postsConsidered, duration_ms: result.durationMs, external_calls: 0 } });
  revalidatePath(`/admin/solicitacoes/${id}`); revalidatePath(`/analisar/${id}`);
  return { ok: true, message: `Métricas recalculadas na versão ${result.version}, sem chamadas externas.` };
}
