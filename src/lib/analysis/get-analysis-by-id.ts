import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildAnalysisViewModel } from "./analysis-view-model";
import { developmentDemoAnalysis, developmentDemoId } from "./development-demo";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const getAnalysisById = cache(async (requestId: string, anonymousSessionId: string | undefined) => {
  if (process.env.NODE_ENV === "development" && process.env.ANALYSIS_DEV_DEMO === "true" && requestId === developmentDemoId) return developmentDemoAnalysis();
  if (!uuid.test(requestId) || !anonymousSessionId || !uuid.test(anonymousSessionId)) return null;
  const admin = createAdminClient(); if (!admin) return null;
  const { data: request } = await admin.from("analysis_requests").select("id,instagram_username,instagram_profile_url,status,created_at,metadata,anonymous_session_id,user_id").eq("id", requestId).maybeSingle();
  if (!request || request.anonymous_session_id !== anonymousSessionId) return null;
  const { data: result } = await admin.from("analysis_results").select("data_quality,profile_data,posts_data,metrics,observations,fetched_at,source_metadata").eq("request_id", requestId).maybeSingle();
  return buildAnalysisViewModel(request, result);
});

export async function getSafeAnalysisStatus(requestId: string, anonymousSessionId: string | undefined) {
  const view = await getAnalysisById(requestId, anonymousSessionId); return view ? { state: view.state, stage: view.stage } : null;
}
