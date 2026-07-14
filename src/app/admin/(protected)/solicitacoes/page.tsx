import Link from "next/link";
import { requireAdminSession } from "@/lib/admin/auth";
import { hasPermission } from "@/lib/admin/permissions";
import { listAnalysisRequests } from "@/lib/admin/data";
import { AdminExportDialog } from "@/components/admin/admin-export-dialog";
import { AdminEmptyState, AdminPageHeader, AdminPagination, AdminStatusBadge } from "@/components/admin/admin-ui";

const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default async function AnalysisListPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const session = await requireAdminSession("analysis.view");
  const query = await searchParams;
  const data = await listAnalysisRequests(query);
  const paginationQuery = new URLSearchParams(Object.entries(query).filter(([key, value]) => key !== "page" && value) as [string, string][]).toString();
  const exportHref = `/admin/api/export/solicitacoes${paginationQuery ? `?${paginationQuery}` : ""}`;

  return <>
    <AdminPageHeader eyebrow="OPERAÇÃO" title="Solicitações" description={`${data.total} registro(s), com filtros processados no banco.`} action={hasPermission(session.profile.role, "analysis.export") ? <AdminExportDialog href={exportHref} /> : undefined} />
    <form className="admin-filter-form" method="get">
      <label>Buscar perfil<input name="search" defaultValue={query.search} maxLength={30} /></label>
      <label>Status<select name="status" defaultValue={query.status || ""}><option value="">Todos</option>{["pending","processing","preview_ready","completed","failed","cancelled","expired"].map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>De<input type="date" name="from" defaultValue={query.from} /></label>
      <label>Até<input type="date" name="to" defaultValue={query.to} /></label>
      <label>Origem<input name="source" defaultValue={query.source} /></label>
      <label>Campanha<input name="campaign" defaultValue={query.campaign} /></label>
      <label>Ordem<select name="order" defaultValue={query.order || "newest"}><option value="newest">Mais recentes</option><option value="oldest">Mais antigas</option></select></label>
      <button className="admin-primary-button">Filtrar</button>
    </form>
    <section className="admin-panel">{data.rows.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Perfil</th><th>Status</th><th>Data</th><th>Origem</th><th>Campanha</th><th>Usuário</th><th>Expiração</th><th>Ação</th></tr></thead><tbody>{data.rows.map((row) => <tr key={row.id}><td>@{row.instagram_username}</td><td><AdminStatusBadge status={row.status} /></td><td>{dateTime.format(new Date(row.created_at))}</td><td>{row.utm_source || "direto"}</td><td>{row.utm_campaign || "—"}</td><td>{row.user_id ? "associado" : "anônimo"}</td><td>{dateTime.format(new Date(row.expires_at))}</td><td><Link href={`/admin/solicitacoes/${row.id}`}>Detalhes</Link></td></tr>)}</tbody></table></div> : <AdminEmptyState title="Nenhuma solicitação encontrada" message="Ajuste os filtros ou aguarde novos registros." />}</section>
    <AdminPagination page={data.page} totalPages={data.totalPages} baseUrl="/admin/solicitacoes" query={paginationQuery} />
  </>;
}
