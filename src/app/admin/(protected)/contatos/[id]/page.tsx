import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/admin/auth";
import { hasPermission } from "@/lib/admin/permissions";
import { getContact } from "@/lib/admin/data";
import { updateContactAction, criticalRecordAction } from "@/app/admin/actions/operations";
import { AdminActionForm } from "@/components/admin/admin-action-form";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { AdminPageHeader, AdminStatusBadge } from "@/components/admin/admin-ui";

const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" });
export default async function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession("contacts.view"); const { id } = await params; const data = await getContact(id); if (!data) notFound(); const row = data.record;
  return <><AdminPageHeader eyebrow="CONTATO" title={row.name} description={`Recebido em ${dateTime.format(new Date(row.created_at))}`} />
    <section className="admin-grid-two"><article className="admin-panel"><h2>Dados de contato</h2><dl className="admin-details"><dt>ID</dt><dd className="admin-mono">{row.id}</dd><dt>E-mail</dt><dd>{row.email}</dd><dt>Assunto</dt><dd>{row.subject}</dd><dt>Status</dt><dd><AdminStatusBadge status={row.status} /></dd><dt>Anonimizada</dt><dd>{row.anonymized_at ? dateTime.format(new Date(row.anonymized_at)) : "Não"}</dd></dl></article><article className="admin-panel"><h2>Mensagem</h2><p className="admin-message">{row.message}</p></article></section>
    {hasPermission(session.profile.role, "contacts.manage") && <section className="admin-panel"><h2>Atendimento interno</h2><AdminActionForm action={updateContactAction}><input type="hidden" name="id" value={row.id} /><div className="admin-form-row"><label>Status<select name="status" defaultValue={row.status}>{["new","in_progress","answered","archived","spam","resolved"].map((value) => <option key={value}>{value}</option>)}</select></label><label>Observações internas<textarea name="notes" defaultValue={row.admin_notes || ""} maxLength={4000} /></label></div></AdminActionForm></section>}
    <section className="admin-panel"><h2>Histórico administrativo</h2>{data.history.length ? <table className="admin-table"><thead><tr><th>Data</th><th>Ação</th><th>Função</th></tr></thead><tbody>{data.history.map((item) => <tr key={item.id}><td>{dateTime.format(new Date(item.created_at))}</td><td>{item.action.replaceAll("_", " ")}</td><td>{item.admin_role}</td></tr>)}</tbody></table> : <p className="admin-muted">Nenhuma alteração administrativa registrada.</p>}</section>
    {hasPermission(session.profile.role, "contacts.delete") && <section className="admin-danger-zone"><h2>Excluir mensagem</h2><p>A exclusão é permanente. A auditoria registra a existência da operação sem copiar a mensagem.</p><AdminConfirmDialog action={criticalRecordAction} id={row.id} operation="delete_contact" expected="EXCLUIR" title="Excluir mensagem de contato" description="Nome, e-mail e conteúdo serão removidos permanentemente." buttonLabel="Excluir mensagem" /></section>}
  </>;
}
