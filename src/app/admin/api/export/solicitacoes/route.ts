import { NextResponse } from "next/server";
import { authorizeAdminAction } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { createCsv } from "@/lib/admin/csv";
import { writeAudit } from "@/lib/admin/audit";

type AnalysisExportRow = {
  id: string; profile: string; status: string; created_at: string; utm_source: string | null;
  utm_campaign: string | null; has_user: boolean; expires_at: string;
};

function dateFilter(value: string | null, endOfDay = false) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export async function GET(request: Request) {
  try {
    await authorizeAdminAction("analysis.export");
    const maximum = Math.min(Math.max(Number(process.env.ADMIN_EXPORT_MAX_ROWS || "1000"), 1), 5000);
    const supabase = await createClient();
    const params = new URL(request.url).searchParams;
    const rpcParams = {
      p_limit: maximum,
      p_search: params.get("search") || null,
      p_status: params.get("status") || null,
      p_source: params.get("source") || null,
      p_campaign: params.get("campaign") || null,
      p_from: dateFilter(params.get("from")),
      p_to: dateFilter(params.get("to"), true),
      p_oldest_first: params.get("order") === "oldest",
    };
    const { data, error } = await supabase.rpc("admin_export_analysis_requests", rpcParams);
    if (error) throw error;
    const rows = ((data || []) as AnalysisExportRow[]).map((row) => [row.id, row.profile, row.status, row.created_at, row.utm_source, row.utm_campaign, row.has_user, row.expires_at]);
    await writeAudit({ action: "analysis_requests_exported", entityType: "analysis_request", metadata: { row_count: rows.length, limit: maximum, filtered: Array.from(params.keys()).length > 0 } });
    return new NextResponse(createCsv(["id","perfil","status","criado_em","origem","campanha","usuario_associado","expira_em"], rows), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="solicitacoes-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Exportação não autorizada ou indisponível." }, { status: 403 });
  }
}
