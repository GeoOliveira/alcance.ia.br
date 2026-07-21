import { notFound } from "next/navigation";
import { PanelBarChart } from "@/components/whatsapp-manager/dashboard-charts";
import { getLinkMetrics, getUserLink, syncCurrentUserLinkMetrics } from "@/lib/whatsapp-manager/data";

export default async function MetricsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await syncCurrentUserLinkMetrics(id);
  const [link, metrics] = await Promise.all([getUserLink(id, { syncMetrics: false }), getLinkMetrics(id, { syncMetrics: false })]);
  if (!link) notFound();
  const daily = metrics?.daily.slice(-14).map((item) => ({ date: item.date, value: item.clicks })) || [];
  return <>
    <header className="panel-heading"><div><span>MÉTRICAS</span><h1>{link.title}</h1><p>Totais sincronizados pelo contrato privado do Encurta.io, com cache de cinco minutos.</p></div></header>
    <section className="panel-stats"><article className="panel-stat" data-tone="purple"><header>Cliques totais</header><strong>{metrics?.total_clicks ?? link.click_count}</strong><small>{metrics ? `Sincronizado em ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(metrics.cached_at))}` : "Aguardando sincronização"}</small></article><article className="panel-stat" data-tone="green"><header>Último acesso</header><strong>{metrics?.last_click_at ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(new Date(metrics.last_click_at)) : "—"}</strong><small>Dado agregado do provedor</small></article><article className="panel-stat" data-tone="blue"><header>Humanos estimados</header><strong>{metrics?.human_estimate ?? "—"}</strong><small>O contrato atual não classifica visitantes</small></article><article className="panel-stat" data-tone="orange"><header>Bots</header><strong>{metrics?.bot_count ?? "—"}</strong><small>O contrato atual não classifica bots</small></article></section>
    <section className="panel-card panel-chart-card"><header><div><span>EVOLUÇÃO</span><h2>Cliques observados por sincronização</h2><p>Os incrementos são registrados na data em que a Alcance IA consulta o total atualizado.</p></div></header>{daily.length ? <PanelBarChart points={daily} emptyMessage="Este link ainda não recebeu cliques." /> : <div className="metrics-placeholder"><h2>Este link ainda não recebeu cliques</h2><p>A consulta ao Encurta.io está ativa. O gráfico será preenchido automaticamente quando o total de acessos aumentar.</p></div>}</section>
  </>;
}
