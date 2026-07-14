import { requireAdminSession } from "@/lib/admin/auth";
import { permissionsFor, roleLabels } from "@/lib/admin/permissions";
import { AdminPageHeader } from "@/components/admin/admin-ui";

export default async function AdminProfilePage() {
  const session = await requireAdminSession();
  return <><AdminPageHeader eyebrow="CONTA" title="Meu perfil" description="Informações mínimas da sua conta administrativa." /><section className="admin-grid-two"><article className="admin-panel"><h2>Identidade</h2><dl className="admin-details"><dt>Nome</dt><dd>{session.profile.display_name}</dd><dt>E-mail</dt><dd>{session.email}</dd><dt>Função</dt><dd>{roleLabels[session.profile.role]}</dd><dt>Status</dt><dd>Ativo</dd><dt>Último login</dt><dd>{session.profile.last_login_at ? new Date(session.profile.last_login_at).toLocaleString("pt-BR") : "Não registrado"}</dd></dl></article><article className="admin-panel"><h2>Permissões efetivas</h2><ul>{permissionsFor(session.profile.role).map((permission) => <li key={permission}>{permission}</li>)}</ul><p className="admin-note">A autenticação em dois fatores está planejada para a próxima versão.</p></article></section></>;
}
