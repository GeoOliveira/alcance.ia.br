import { requireAdminSession } from "@/lib/admin/auth";
import { listAdminTable } from "@/lib/admin/data";
import { saveFaqAction, deleteFaqAction } from "@/app/admin/actions/operations";
import { AdminActionForm } from "@/components/admin/admin-action-form";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { hasPermission } from "@/lib/admin/permissions";

type FaqRow = { id: string; question: string; answer: string; position: number; is_active: boolean };
export default async function FaqManagementPage() {
  const session = await requireAdminSession("faq.manage"); const rows = await listAdminTable("site_faqs") as FaqRow[];
  return <><AdminPageHeader eyebrow="CONTEÚDO" title="Perguntas frequentes" description="Crie, edite, reorganize e controle a publicação das perguntas da Home." />
    <section className="admin-panel"><h2>Nova pergunta</h2><AdminActionForm action={saveFaqAction}><div className="admin-form-row"><label>Pergunta<input name="question" required minLength={10} maxLength={240} /></label><label>Posição<input name="position" type="number" defaultValue={rows.length ? Math.max(...rows.map((row) => row.position)) + 10 : 10} min={0} max={10000} /></label></div><label>Resposta<textarea name="answer" required minLength={10} maxLength={2000} /></label><label>Status<select name="isActive" defaultValue="true"><option value="true">Ativa</option><option value="false">Inativa</option></select></label></AdminActionForm></section>
    <div className="admin-settings-grid">{rows.map((row) => <article className="admin-panel" key={row.id}><AdminActionForm action={saveFaqAction}><input type="hidden" name="id" value={row.id} /><div className="admin-form-row"><label>Pergunta<input name="question" defaultValue={row.question} required maxLength={240} /></label><label>Posição<input name="position" type="number" defaultValue={row.position} min={0} max={10000} /></label></div><label>Resposta<textarea name="answer" defaultValue={row.answer} required maxLength={2000} /></label><label>Status<select name="isActive" defaultValue={String(row.is_active)}><option value="true">Ativa</option><option value="false">Inativa</option></select></label></AdminActionForm>{hasPermission(session.profile.role, "faq.delete") && <div className="admin-form-actions"><AdminConfirmDialog action={deleteFaqAction} id={row.id} operation="delete_faq" expected="EXCLUIR" title="Excluir pergunta" description="A pergunta será removida da Home e do banco. A ação será auditada." buttonLabel="Excluir" /></div>}</article>)}</div>
  </>;
}
