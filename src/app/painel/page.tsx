import Link from "next/link";
import { getDashboardData } from "@/lib/whatsapp-manager/data";
import { ManagerIcon } from "@/components/whatsapp-manager/icons";
import { LinkStatusChart, PanelBarChart, TopLinksChart } from "@/components/whatsapp-manager/dashboard-charts";

export default async function DashboardPage() {
  const data = await getDashboardData();
  return <>
    <header className="panel-heading panel-dashboard-heading"><div><span>VISÃO GERAL</span><h1>Seus links, resultados e oportunidades.</h1><p>Acompanhe a operação do WhatsApp com dados sincronizados diretamente do Encurta.io.</p></div><div className="panel-heading-actions"><Link className="panel-secondary" href="/painel/qr-codes">Ver QR Codes</Link><Link className="panel-primary" href="/painel/links/novo">Criar novo link</Link></div></header>
    <section className="panel-stats" aria-label="Resumo da conta"><Stat label="Links criados" value={data.total} icon="link" note={`${data.active} em operação`} tone="blue" /><Stat label="Links ativos" value={data.active} icon="shield" note={data.inactive ? `${data.inactive} inativo(s)` : "Todos disponíveis"} tone="green" /><Stat label="Cliques totais" value={data.totalClicks} icon="chart" note="Sincronizados do Encurta.io" tone="purple" /><Stat label="Últimos 7 dias" value={data.last7Days} icon="chart" note="Cliques observados nas sincronizações" tone="orange" /></section>
    <div className="panel-dashboard-grid">
      <section className="panel-card panel-chart-card panel-chart-wide"><header><div><span>DESEMPENHO</span><h2>Cliques sincronizados</h2><p>Variação observada nos últimos 14 dias.</p></div><strong>{data.totalClicks.toLocaleString("pt-BR")} total</strong></header><PanelBarChart points={data.clickTrend} emptyMessage="Os acessos aparecerão após a próxima sincronização do Encurta.io." /></section>
      <section className="panel-card panel-chart-card"><header><div><span>STATUS</span><h2>Saúde dos links</h2><p>Distribuição atual da sua carteira.</p></div></header><LinkStatusChart active={data.active} inactive={data.inactive} expired={data.expired} /></section>
      <section className="panel-card panel-chart-card"><header><div><span>CRIAÇÃO</span><h2>Novos links</h2><p>Ritmo de criação nos últimos 14 dias.</p></div></header><PanelBarChart points={data.creationTrend} emptyMessage="Nenhum link criado neste período." /></section>
      <section className="panel-card panel-chart-card"><header><div><span>RANKING</span><h2>Links mais acessados</h2><p>Comparação pelos cliques totais.</p></div><Link href="/painel/links">Ver todos</Link></header><TopLinksChart links={data.topLinks} /></section>
    </div>
    <section className="panel-card panel-recent-card"><header><div><span>RECENTES</span><h2>Últimos links</h2></div><Link href="/painel/links">Gerenciar todos</Link></header>{data.recent.length ? <div className="link-list">{data.recent.map((link) => <div className="link-row" key={link.id}><div className="link-main"><strong>{link.title}</strong><Link href={`/painel/links/${link.id}`}>{link.short_url}</Link></div><span className={`status-badge ${link.status}`}>{link.status === "active" ? "Ativo" : link.status}</span><span>{link.click_count} cliques</span><Link href={`/painel/links/${link.id}`}>Detalhes</Link></div>)}</div> : <Empty />}</section>
  </>;
}

function Stat({ label, value, icon, note, tone }: { label: string; value: number; icon: "link" | "shield" | "chart"; note: string; tone: string }) {
  return <article className="panel-stat" data-tone={tone}><header>{label}<span><ManagerIcon name={icon} /></span></header><strong>{value.toLocaleString("pt-BR")}</strong><small>{note}</small></article>;
}

function Empty() {
  return <div className="panel-empty"><span>↗</span><h2>Crie seu primeiro link</h2><p>Informe seu número do WhatsApp e gere um link curto para começar.</p><Link className="panel-primary" href="/painel/links/novo">Criar link</Link></div>;
}
