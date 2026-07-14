import { requireAdminSession } from "@/lib/admin/auth";
import { listAdminTable } from "@/lib/admin/data";
import { AdminEmptyState, AdminPageHeader } from "@/components/admin/admin-ui";

type AuditRow = { id: string; created_at: string; admin_role: string; action: string; entity_type: string; entity_id: string | null; metadata: Record<string, unknown> };
export default async function AuditPage() {
  await requireAdminSession("audit.view"); const rows = await listAdminTable("admin_audit_logs") as AuditRow[];
  return <><AdminPageHeader eyebrow="SEGURANÇA" title="Auditoria" description="Últimas 100 ações. Logs são imutáveis e não incluem senhas, tokens ou conteúdo integral de mensagens." /><section className="admin-panel">{rows.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Data</th><th>Ação</th><th>Entidade</th><th>ID</th><th>Função</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{new Date(row.created_at).toLocaleString("pt-BR")}</td><td>{row.action.replaceAll("_", " ")}</td><td>{row.entity_type}</td><td className="admin-mono">{row.entity_id || "—"}</td><td>{row.admin_role}</td></tr>)}</tbody></table></div> : <AdminEmptyState title="Sem registros" message="As ações administrativas relevantes aparecerão aqui." />}</section></>;
}
