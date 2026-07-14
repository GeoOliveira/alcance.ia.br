import Link from "next/link";
import { requireAdminSession } from "@/lib/admin/auth";
import { getDashboardData } from "@/lib/admin/data";
import { hasPermission } from "@/lib/admin/permissions";
import { AdminEmptyState, AdminPageHeader, AdminStatCard, AdminStatusBadge } from "@/components/admin/admin-ui";

const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default async function AdminDashboardPage() {
  const session = await requireAdminSession("dashboard.view");
  const data = await getDashboardData();
  return <><AdminPageHeader eyebrow="OPERAÇÃO" title="Visão geral" description="Dados reais da operação, com consultas limitadas e sem métricas inventadas." />
    {!data.operational && <p className="admin-note">Algumas métricas não estão disponíveis para sua função ou o banco respondeu parcialmente.</p>}
    <section className="admin-stat-grid" aria-label="Indicadores principais">
      <AdminStatCard label="Solicitações hoje" value={data.counts.today} />
      <AdminStatCard label="Últimos 7 dias" value={data.counts.week} />
      <AdminStatCard label="Solicitações pendentes" value={data.counts.pending} />
      <AdminStatCard label="Solicitações com erro" value={data.counts.failed} />
      <AdminStatCard label="Contatos não tratados" value={data.counts.contacts} />
      <AdminStatCard label="Status do sistema" value={data.operational ? "Operacional" : "Atenção"} />
    </section>
    <section className="admin-grid-two"><DashboardPanel title="Últimas solicitações" href={hasPermission(session.profile.role, "analysis.view") ? "/admin/solicitacoes" : undefined}>
      {data.requests.length ? <table className="admin-table"><tbody>{data.requests.map((item) => <tr key={item.id}><td><Link href={`/admin/solicitacoes/${item.id}`}>@{item.instagram_username}</Link><br /><span className="admin-muted">{dateTime.format(new Date(item.created_at))}</span></td><td><AdminStatusBadge status={item.status} /></td></tr>)}</tbody></table> : <AdminEmptyState title="Nenhuma solicitação" message="Ainda não há registros para exibir." />}
    </DashboardPanel><DashboardPanel title="Últimas mensagens" href={hasPermission(session.profile.role, "contacts.view") ? "/admin/contatos" : undefined}>
      {data.contacts.length ? <table className="admin-table"><tbody>{data.contacts.map((item) => <tr key={item.id}><td><Link href={`/admin/contatos/${item.id}`}>{item.name}</Link><br /><span className="admin-muted">{item.subject}</span></td><td><AdminStatusBadge status={item.status} /></td></tr>)}</tbody></table> : <AdminEmptyState title="Nenhum contato" message="Ainda não há mensagens para exibir." />}
    </DashboardPanel></section>
    <section className="admin-grid-two"><Breakdown title="Análises por status" values={Object.entries(data.byStatus)} /><Breakdown title="Principais origens" values={data.sources} /><Breakdown title="Campanhas com maior volume" values={data.campaigns} />
      <DashboardPanel title="Últimas ações" href={hasPermission(session.profile.role, "audit.view") ? "/admin/auditoria" : undefined}>{data.audits.length ? <table className="admin-table"><tbody>{data.audits.map((item) => <tr key={item.id}><td>{item.action.replaceAll("_", " ")}<br /><span className="admin-muted">{dateTime.format(new Date(item.created_at))}</span></td><td>{item.admin_role}</td></tr>)}</tbody></table> : <AdminEmptyState title="Sem ações disponíveis" message="Os registros aparecerão conforme o painel for utilizado." />}</DashboardPanel>
    </section>
  </>;
}

function DashboardPanel({ title, href, children }: { title: string; href?: string; children: React.ReactNode }) {
  return <article className="admin-panel"><div className="admin-panel-header"><h2>{title}</h2>{href && <Link href={href}>Ver todos</Link>}</div>{children}</article>;
}
function Breakdown({ title, values }: { title: string; values: [string, number][] }) {
  return <article className="admin-panel"><h2>{title}</h2>{values.length ? <table className="admin-table"><tbody>{values.map(([label, value]) => <tr key={label}><td>{label.replaceAll("_", " ")}</td><td><strong>{value}</strong></td></tr>)}</tbody></table> : <AdminEmptyState title="Sem dados" message="Não há volume suficiente no período." />}</article>;
}
