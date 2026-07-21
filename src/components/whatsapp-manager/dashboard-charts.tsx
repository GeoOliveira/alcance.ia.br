import Link from "next/link";
import type { ManagerLink } from "@/lib/whatsapp-manager/types";

type Point = { date: string; value: number };

function shortDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

export function PanelBarChart({ points, emptyMessage }: { points: Point[]; emptyMessage: string }) {
  const maximum = Math.max(...points.map((point) => point.value), 0);
  return <div className="panel-chart" role="img" aria-label={maximum ? `Gráfico com máximo de ${maximum}` : emptyMessage}>
    <div className="panel-chart-grid" aria-hidden="true"><i /><i /><i /></div>
    <div className="panel-chart-bars">{points.map((point, index) => <div className="panel-chart-column" key={point.date} title={`${shortDate(point.date)}: ${point.value}`}><span>{point.value || ""}</span><i style={{ height: maximum ? `${Math.max(point.value / maximum * 100, point.value ? 6 : 1)}%` : "1%" }} /><small>{index % 2 === 0 || index === points.length - 1 ? shortDate(point.date) : ""}</small></div>)}</div>
    {!maximum ? <p>{emptyMessage}</p> : null}
  </div>;
}

export function LinkStatusChart({ active, inactive, expired }: { active: number; inactive: number; expired: number }) {
  const total = active + inactive + expired;
  const statuses = [
    { key: "active", label: "Ativos", value: active, href: "/painel/links?status=active" },
    { key: "inactive", label: "Inativos", value: inactive, href: "/painel/links?status=inactive" },
    { key: "expired", label: "Expirados", value: expired, href: "/painel/links?status=expired" },
  ] as const;
  const activePercent = total ? Math.round(active / total * 100) : 0;
  const attention = inactive + expired;
  const health = !total ? { label: "Sem dados", tone: "empty" } : activePercent === 100 ? { label: "Excelente", tone: "great" } : activePercent >= 75 ? { label: "Boa", tone: "good" } : activePercent >= 50 ? { label: "Atenção", tone: "warning" } : { label: "Crítica", tone: "critical" };
  const description = !total
    ? "Crie seu primeiro link para acompanhar a distribuição."
    : attention
      ? `${attention} ${attention === 1 ? "link precisa" : "links precisam"} da sua atenção.`
      : "Todos os links estão disponíveis.";

  return <div className="panel-status-chart">
    <div className="panel-health-summary" data-tone={health.tone}>
      <div><span>ÍNDICE OPERACIONAL</span><b>{health.label}</b></div>
      <strong>{total ? `${activePercent}%` : "—"}</strong>
      <small>{total ? `${active} de ${total} links ativos` : "Nenhum link criado"}</small>
      <p>{description}</p>
    </div>
    <div className="panel-health-details">
      <div className="panel-health-bar" role="img" aria-label={total ? `${active} links ativos, ${inactive} inativos e ${expired} expirados.` : "Ainda não há links para exibir."}>
        {statuses.map((status) => status.value ? <i key={status.key} data-tone={status.key} style={{ width: `${status.value / total * 100}%` }} /> : null)}
      </div>
      <div className="panel-health-list">
        {statuses.map((status) => {
          const percent = total ? Math.round(status.value / total * 100) : 0;
          return <Link href={status.href} key={status.key} aria-label={`Ver ${status.value} links ${status.label.toLowerCase()}`}>
            <i data-tone={status.key} />
            <span><strong>{status.label}</strong><small>{percent}% da carteira</small></span>
            <b>{status.value}</b>
            <em aria-hidden="true">→</em>
          </Link>;
        })}
      </div>
    </div>
  </div>;
}

export function TopLinksChart({ links }: { links: ManagerLink[] }) {
  const maximum = Math.max(...links.map((link) => Number(link.click_count)), 0);
  if (!links.length) return <div className="panel-chart-empty">Crie um link para começar a comparar resultados.</div>;
  return <div className="panel-top-links">{links.map((link, index) => <Link href={`/painel/links/${link.id}`} key={link.id}><span>{index + 1}</span><div><strong>{link.title}</strong><i><b style={{ width: maximum ? `${Math.max(Number(link.click_count) / maximum * 100, 3)}%` : "3%" }} /></i></div><em>{Number(link.click_count).toLocaleString("pt-BR")}</em></Link>)}</div>;
}
