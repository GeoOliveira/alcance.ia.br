import { requireAdminSession } from "@/lib/admin/auth";
import { listAdminTable } from "@/lib/admin/data";
import { updateContentAction } from "@/app/admin/actions/operations";
import { AdminActionForm } from "@/components/admin/admin-action-form";
import { AdminPageHeader } from "@/components/admin/admin-ui";

type ContentRow = { id: string; section: string; content_key: string; content_value: string; content_type: string; is_active: boolean };
export default async function HomeContentPage() {
  await requireAdminSession("content.manage"); const rows = await listAdminTable("site_content") as ContentRow[];
  return <><AdminPageHeader eyebrow="CONTEÚDO" title="Página inicial" description="Campos selecionados e validados. HTML e JavaScript não são aceitos." />
    <div className="admin-settings-grid">{rows.map((row) => <article className="admin-setting" key={row.id}><div><h3>{row.section}.{row.content_key}</h3><p>{row.content_type} · {row.is_active ? "ativo" : "inativo"}</p></div><AdminActionForm action={updateContentAction} className="admin-form admin-inline-form"><input type="hidden" name="id" value={row.id} /><label>Texto{row.content_type === "text" ? <textarea name="value" defaultValue={row.content_value} maxLength={1000} /> : <input name="value" defaultValue={row.content_value} maxLength={1000} />}</label></AdminActionForm></article>)}</div>
  </>;
}
