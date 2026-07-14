import Link from "next/link";
import { requireAdminSession } from "@/lib/admin/auth";
import { hasPermission } from "@/lib/admin/permissions";
import { listContacts } from "@/lib/admin/data";
import { AdminExportDialog } from "@/components/admin/admin-export-dialog";
import { AdminEmptyState, AdminPageHeader, AdminPagination, AdminStatusBadge } from "@/components/admin/admin-ui";

const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default async function ContactsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const session = await requireAdminSession("contacts.view");
  const query = await searchParams;
  const data = await listContacts(query);
  const paginationQuery = new URLSearchParams(Object.entries(query).filter(([key, value]) => key !== "page" && value) as [string, string][]).toString();
  const exportHref = `/admin/api/export/contatos${paginationQuery ? `?${paginationQuery}` : ""}`;

  return <>
    <AdminPageHeader eyebrow="ATENDIMENTO" title="Contatos" description={`${data.total} mensagem(ns). O conteúdo completo nunca é enviado para analytics ou logs.`} action={hasPermission(session.profile.role, "contacts.export") ? <AdminExportDialog href={exportHref} /> : undefined} />
    <form className="admin-filter-form" method="get">
      <label>Buscar por nome ou e-mail<input name="search" defaultValue={query.search} maxLength={100} /></label>
      <label>Status<select name="status" defaultValue={query.status || ""}><option value="">Todos</option>{["new","in_progress","answered","archived","spam","resolved"].map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>Assunto<select name="subject" defaultValue={query.subject || ""}><option value="">Todos</option>{["analysis","support","privacy","partnerships","press","other"].map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>Ordem<select name="order" defaultValue={query.order || "newest"}><option value="newest">Mais recentes</option><option value="oldest">Mais antigas</option></select></label>
      <button className="admin-primary-button">Filtrar</button>
    </form>
    <section className="admin-panel">{data.rows.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Nome</th><th>E-mail</th><th>Assunto</th><th>Status</th><th>Data</th><th>Ação</th></tr></thead><tbody>{data.rows.map((row) => <tr key={row.id}><td>{row.name}</td><td>{row.email}</td><td>{row.subject}</td><td><AdminStatusBadge status={row.status} /></td><td>{dateTime.format(new Date(row.created_at))}</td><td><Link href={`/admin/contatos/${row.id}`}>Abrir</Link></td></tr>)}</tbody></table></div> : <AdminEmptyState title="Nenhuma mensagem encontrada" message="Ajuste os filtros ou aguarde novos contatos." />}</section>
    <AdminPagination page={data.page} totalPages={data.totalPages} baseUrl="/admin/contatos" query={paginationQuery} />
  </>;
}
