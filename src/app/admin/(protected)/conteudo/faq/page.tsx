import { requireAdminSession } from "@/lib/admin/auth";
import { listAdminTable } from "@/lib/admin/data";
import { saveFaqAction, deleteFaqAction, duplicateFaqAction } from "@/app/admin/actions/operations";
import { AdminActionForm } from "@/components/admin/admin-action-form";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { AdminEmptyState, AdminPageHeader } from "@/components/admin/admin-ui";
import { hasPermission } from "@/lib/admin/permissions";
import { FaqFields } from "./faq-fields";

type FaqRow = { id: string; question: string; answer: string; position: number; is_active: boolean; updated_at: string; updated_by: string | null };
type Params = { busca?: string; status?: string; ordem?: string };
export default async function FaqManagementPage({ searchParams }: { searchParams: Promise<Params> }) {
  const session = await requireAdminSession("faq.manage");
  const [allRows, params] = [await listAdminTable("site_faqs") as FaqRow[], await searchParams];
  const query = (params.busca || "").toLocaleLowerCase("pt-BR").slice(0, 100);
  const filtered = allRows.filter((row) => (!query || `${row.question} ${row.answer}`.toLocaleLowerCase("pt-BR").includes(query)) && (!params.status || String(row.is_active) === params.status));
  const rows = [...filtered].sort((a, b) => params.ordem === "recentes" ? +new Date(b.updated_at) - +new Date(a.updated_at) : params.ordem === "pergunta" ? a.question.localeCompare(b.question, "pt-BR") : a.position - b.position);
  return <><AdminPageHeader eyebrow="CONTEÚDO EDITORIAL" title="Perguntas e respostas" description="Crie, filtre, ordene, visualize e publique respostas seguras na Home." />
    <form className="admin-filter-form admin-faq-filters"><label>Busca<input name="busca" defaultValue={params.busca} placeholder="Pergunta ou resposta" /></label><label>Status<select name="status" defaultValue={params.status}><option value="">Todas</option><option value="true">Ativas</option><option value="false">Inativas</option></select></label><label>Ordenação<select name="ordem" defaultValue={params.ordem}><option value="posicao">Posição</option><option value="recentes">Atualizadas recentemente</option><option value="pergunta">Pergunta A–Z</option></select></label><button className="admin-secondary-button">Filtrar</button></form>
    <details className="admin-panel admin-faq-create"><summary>+ Criar nova pergunta</summary><AdminActionForm action={saveFaqAction} submitLabel="Criar pergunta"><FaqFields position={allRows.length ? Math.max(...allRows.map((row) => row.position)) + 10 : 10} /></AdminActionForm></details>
    <div className="admin-faq-summary"><span><strong>{allRows.length}</strong> cadastradas</span><span><strong>{allRows.filter((row) => row.is_active).length}</strong> publicadas</span><span><strong>{rows.length}</strong> exibidas</span></div>
    <div className="admin-faq-list">{rows.map((row) => <article className="admin-panel admin-faq-card" key={row.id}><header><div><span className={`admin-status ${row.is_active ? "admin-status-completed" : ""}`}>{row.is_active ? "Ativa" : "Inativa"}</span><small>Posição {row.position} · Atualizada {new Date(row.updated_at).toLocaleString("pt-BR")}</small></div><h2>{row.question}</h2><p>{row.answer.length > 180 ? `${row.answer.slice(0, 180)}…` : row.answer}</p></header><details><summary>Editar pergunta</summary><AdminActionForm action={saveFaqAction}><input type="hidden" name="id" value={row.id} /><FaqFields question={row.question} answer={row.answer} position={row.position} active={row.is_active} /></AdminActionForm></details><footer><AdminActionForm action={duplicateFaqAction} className="admin-form admin-faq-duplicate" submitLabel="Duplicar"><input type="hidden" name="id" value={row.id} /></AdminActionForm>{hasPermission(session.profile.role, "faq.delete") && <AdminConfirmDialog action={deleteFaqAction} id={row.id} operation="delete_faq" expected="EXCLUIR" title="Excluir pergunta" description="A pergunta será removida da Home e do banco. A ação será auditada." buttonLabel="Excluir" />}</footer></article>)}</div>
    {!rows.length && <AdminEmptyState title="Nenhuma pergunta encontrada" message="Crie a primeira pergunta ou revise os filtros." />}
  </>;
}
