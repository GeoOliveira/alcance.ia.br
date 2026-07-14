import { NextResponse } from "next/server";
import { authorizeAdminAction } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { createCsv } from "@/lib/admin/csv";
import { writeAudit } from "@/lib/admin/audit";

export async function GET(request: Request) {
  try {
    await authorizeAdminAction("contacts.export");
    const maximum = Math.min(Math.max(Number(process.env.ADMIN_EXPORT_MAX_ROWS || "1000"), 1), 5000);
    const supabase = await createClient();
    const params = new URL(request.url).searchParams;
    let query = supabase.from("contact_messages").select("id,name,email,subject,status,created_at");
    const search = params.get("search");
    if (search) {
      const clean = search.slice(0, 100).replace(/[%_,()]/g, "");
      query = query.or(`name.ilike.%${clean}%,email.ilike.%${clean}%`);
    }
    const status = params.get("status");
    const subject = params.get("subject");
    if (status) query = query.eq("status", status.slice(0, 40));
    if (subject) query = query.eq("subject", subject.slice(0, 40));
    const { data, error } = await query.order("created_at", { ascending: params.get("order") === "oldest" }).limit(maximum);
    if (error) throw error;
    const rows = (data || []).map((row) => [row.id, row.name, row.email, row.subject, row.status, row.created_at]);
    await writeAudit({ action: "contact_messages_exported", entityType: "contact_message", metadata: { row_count: rows.length, limit: maximum, filtered: Array.from(params.keys()).length > 0 } });
    return new NextResponse(createCsv(["id","nome","email","assunto","status","criado_em"], rows), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="contatos-${new Date().toISOString().slice(0, 10)}.csv"`, "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ error: "Exportação não autorizada ou indisponível." }, { status: 403 });
  }
}
