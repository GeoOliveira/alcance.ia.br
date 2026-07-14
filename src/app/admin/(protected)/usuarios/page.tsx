import { requireAdminSession } from "@/lib/admin/auth";
import { hasPermission, roleLabels } from "@/lib/admin/permissions";
import { listAdminTable } from "@/lib/admin/data";
import { createAdminProfileAction, updateAdminProfileAction } from "@/app/admin/actions/operations";
import { AdminActionForm } from "@/components/admin/admin-action-form";
import { AdminPageHeader, AdminStatusBadge } from "@/components/admin/admin-ui";
import type { AdminProfile } from "@/types/admin";

export default async function AdminUsersPage() {
  const session = await requireAdminSession("users.view"); const rows = await listAdminTable("admin_profiles") as AdminProfile[]; const canManage = hasPermission(session.profile.role, "users.manage");
  return <><AdminPageHeader eyebrow="ACESSO" title="Usuários administrativos" description="Somente dados mínimos do perfil administrativo são exibidos. Contas são criadas previamente no Supabase Auth." />
    {canManage && <section className="admin-panel"><h2>Associar usuário existente</h2><p className="admin-note">Informe o UUID de um usuário já criado no Supabase Auth. `super_admin` só pode ser criado pelo processo seguro documentado.</p><AdminActionForm action={createAdminProfileAction}><div className="admin-form-row"><label>UUID do usuário<input name="userId" required /></label><label>Nome de exibição<input name="displayName" required minLength={2} maxLength={100} /></label></div><label>Função<select name="role"><option value="admin">Administrador</option><option value="editor">Editor</option><option value="support">Suporte</option><option value="analyst">Analista</option></select></label></AdminActionForm></section>}
    <section className="admin-panel"><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Nome</th><th>Função</th><th>Status</th><th>Último login</th><th>Gerenciar</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}><td>{row.display_name}<br /><span className="admin-mono">{row.user_id}</span></td><td>{roleLabels[row.role]}</td><td><AdminStatusBadge status={row.is_active ? "active" : "inactive"} /></td><td>{row.last_login_at ? new Date(row.last_login_at).toLocaleString("pt-BR") : "Nunca"}</td><td>{canManage && row.role !== "super_admin" ? <AdminActionForm action={updateAdminProfileAction} className="admin-form admin-user-form"><input type="hidden" name="id" value={row.id} /><select aria-label="Função" name="role" defaultValue={row.role}><option value="admin">Administrador</option><option value="editor">Editor</option><option value="support">Suporte</option><option value="analyst">Analista</option></select><select aria-label="Status" name="isActive" defaultValue={String(row.is_active)}><option value="true">Ativo</option><option value="false">Inativo</option></select><input aria-label="Confirmação" name="confirmation" placeholder="CONFIRMAR" /></AdminActionForm> : "Restrito"}</td></tr>)}</tbody></table></div></section>
  </>;
}
