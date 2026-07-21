import Link from "next/link";
import { requireAdminSession } from "@/lib/admin/auth";
import { getDashboardData } from "@/lib/admin/data";
import { hasPermission } from "@/lib/admin/permissions";
import { AdminEmptyState, AdminPageHeader, AdminStatCard, AdminStatusBadge } from "@/components/admin/admin-ui";

const dateTime = new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" });

export default async function AdminDashboardPage() {
  const session = await requireAdminSession("dashboard.view");
  const data = await getDashboardData();
  const quickLinks = [
    ["Editar páginas", "/admin/conteudo/paginas", "seo.manage"], ["Editar página inicial", "/admin/conteudo/paginas?pagina=home", "content.manage"],
    ["Gerenciar FAQ", "/admin/conteudo/faq", "faq.manage"], ["Gerenciar recursos", "/admin/recursos", "features.manage"],
    ["Ver análises", "/admin/solicitacoes", "analysis.view"], ["Ver auditoria", "/admin/auditoria", "audit.view"],
  ] as const;
  const health = [
    ["Supabase", data.operational ? "Operacional" : "Atenção"],
    ["ScrapeCreators", process.env.SCRAPECREATORS_API_KEY ? "Configurado" : "Não configurado"],
    ["Apify", process.env.APIFY_API_TOKEN ? "Configurado" : "Não configurado"],
    ["Meta", process.env.META_ACCESS_TOKEN ? "Configurado" : "Não configurado"],
    ["OpenAI", process.env.OPENAI_API_KEY ? "Configurado" : "Não configurado"],
    ["Analytics", process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID ? "Configurado" : "Não configurado"],
  ];
  return <><AdminPageHeader eyebrow="CENTRO DE OPERAÇÕES" title="Visão geral" description="Saúde, atividade e conteúdo em uma leitura rápida, usando somente dados já registrados." />
    {!data.operational && <p className="admin-note">Algumas métricas não estão disponíveis para sua função ou o banco respondeu parcialmente.</p>}
    <section className="admin-stat-grid" aria-label="Indicadores principais">
      <AdminStatCard label="Solicitações hoje" value={data.counts.today} />
      <AdminStatCard label="Análises concluídas" value={data.counts.completed} detail="Total registrado" />
      <AdminStatCard label="Solicitações pendentes" value={data.counts.pending} />
      <AdminStatCard label="Solicitações com erro" value={data.counts.failed} />
      <AdminStatCard label="Contatos não tratados" value={data.counts.contacts} />
      <AdminStatCard label="Usuários administrativos" value={data.counts.users} detail="Perfis ativos" />
      <AdminStatCard label="Recursos ativos" value={data.counts.activeFeatures} detail={`${data.counts.premiumFeatures} premium`} />
      <AdminStatCard label="Status geral" value={data.operational ? "Operacional" : "Atenção"} />
    </section>
    <section className="admin-dashboard-strip"><article className="admin-panel"><div className="admin-panel-header"><div><h2>Saúde da plataforma</h2><p>Configuração local e últimos registros, sem chamadas pagas.</p></div></div><div className="admin-health-grid">{health.map(([name, status]) => <div key={name}><span className={`admin-health-dot ${status === "Operacional" || status === "Configurado" ? "is-ok" : status === "Atenção" ? "is-warning" : ""}`} /><strong>{name}</strong><small>{status}</small></div>)}</div></article><article className="admin-panel"><div className="admin-panel-header"><div><h2>Atalhos rápidos</h2><p>Ações disponíveis para sua função.</p></div></div><nav className="admin-quick-links" aria-label="Atalhos administrativos">{quickLinks.filter(([, , permission]) => hasPermission(session.profile.role, permission)).map(([label, href]) => <Link key={href} href={href}>{label}<span aria-hidden="true">→</span></Link>)}</nav></article></section>
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
