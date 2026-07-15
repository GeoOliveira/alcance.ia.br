"use server";
import { revalidatePath } from "next/cache";
import { authorizeAdminAction } from "@/lib/admin/auth";
import { writeAudit } from "@/lib/admin/audit";
import { generateAIAnalysisForRequest } from "@/lib/ai";
import type { ActionState } from "@/types/admin";

const allowed = ["summary", "bioAnalysis", "recommendations", "contentIdeas", "actionPlanExplanation"] as const;
export async function generateAdminAIAnalysisAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let session; try { session = await authorizeAdminAction("ai_integration.execute"); } catch { return { ok: false, message: "Você não possui permissão para executar a integração." }; }
  const requestId = String(formData.get("requestId") || ""); if (!/^[0-9a-f-]{36}$/i.test(requestId)) return { ok: false, message: "Selecione uma análise válida." };
  const requestedFeatures = allowed.filter((item) => formData.get(item) === "on"); if (!requestedFeatures.length) return { ok: false, message: "Selecione ao menos um recurso." };
  const bypassCache = formData.get("bypassCache") === "on";
  await writeAudit({ action: bypassCache ? "ai_force_refresh_requested" : "ai_generation_requested", entityType: "analysis_request", entityId: requestId, metadata: { features: requestedFeatures, bypass_cache: bypassCache, prompt_version: "profile-analysis-v1" } });
  const result = await generateAIAnalysisForRequest(requestId, { force: true, bypassCache, requestedBy: session.userId, source: "admin", requestedFeatures });
  if (!result.ok) { await writeAudit({ action: "ai_generation_failed", entityType: "analysis_request", entityId: requestId, metadata: { code: result.code } }); return { ok: false, message: result.code === "insufficient_data" || result.code === "insufficient_confidence" ? "Não há dados públicos suficientes para gerar recomendações confiáveis." : "Não foi possível gerar a interpretação. Consulte a execução e a configuração." }; }
  await writeAudit({ action: result.cached ? "ai_cache_used" : "ai_generation_completed", entityType: "analysis_request", entityId: requestId, metadata: { execution_id: result.executionId, cache: result.cached } });
  revalidatePath("/admin/integracoes/openai"); revalidatePath("/admin/integracoes/openai/execucoes"); revalidatePath(`/analisar/${requestId}`);
  return { ok: true, message: result.cached ? "Resultado válido reutilizado do cache." : "Interpretação gerada e validada." };
}
