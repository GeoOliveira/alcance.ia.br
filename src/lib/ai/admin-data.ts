import "server-only";
import { createClient } from "@/lib/supabase/server";

export type AIExecutionRow = { id: string; request_id: string; status: string; model: string; prompt_version: string; schema_version: string; metrics_version: string; engagement_formula_version: string; source: string; input_tokens: number; output_tokens: number; total_tokens: number; estimated_cost_usd: number | null; duration_ms: number | null; cache_hit: boolean; validation_status: string; consistency_status: string; error_code: string | null; error_message: string | null; input_snapshot?: unknown; output_snapshot?: unknown; created_at: string; completed_at: string | null };

export async function getOpenAIAdminOverview() {
  const client = await createClient(); const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  const [runs, analyses] = await Promise.all([
    client.from("ai_analysis_runs").select("id,request_id,status,model,prompt_version,schema_version,metrics_version,engagement_formula_version,source,input_tokens,output_tokens,total_tokens,estimated_cost_usd,duration_ms,cache_hit,validation_status,consistency_status,error_code,error_message,created_at,completed_at").gte("created_at", today.toISOString()).order("created_at", { ascending: false }).limit(100),
    client.from("analysis_requests").select("id,instagram_username,status,updated_at").eq("status", "completed").order("updated_at", { ascending: false }).limit(50),
  ]);
  const rows = (runs.data || []) as AIExecutionRow[]; const completed = rows.filter((row) => row.status === "completed");
  return { rows, analyses: analyses.data || [], totals: { executions: rows.length, successRate: rows.length ? completed.length / rows.length * 100 : 0, tokens: rows.reduce((sum, row) => sum + row.total_tokens, 0), estimatedCostUsd: rows.reduce((sum, row) => sum + (row.estimated_cost_usd || 0), 0), averageDurationMs: completed.length ? completed.reduce((sum, row) => sum + (row.duration_ms || 0), 0) / completed.length : 0, cacheHits: rows.filter((row) => row.cache_hit).length } };
}

export async function listOpenAIExecutions() { const client = await createClient(); const { data, error } = await client.from("ai_analysis_runs").select("id,request_id,status,model,prompt_version,schema_version,metrics_version,engagement_formula_version,source,input_tokens,output_tokens,total_tokens,estimated_cost_usd,duration_ms,cache_hit,validation_status,consistency_status,error_code,error_message,created_at,completed_at").order("created_at", { ascending: false }).limit(200); if (error) throw new Error("Não foi possível consultar as execuções de IA."); return data as AIExecutionRow[]; }
export async function getOpenAIExecution(id: string) { if (!/^[0-9a-f-]{36}$/i.test(id)) return null; const client = await createClient(); const { data } = await client.from("ai_analysis_runs").select("*").eq("id", id).maybeSingle(); return data as AIExecutionRow | null; }
