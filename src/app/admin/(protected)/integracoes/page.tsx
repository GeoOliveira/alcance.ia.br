import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { requireAdminSession } from "@/lib/admin/auth";
import { hasPermission } from "@/lib/admin/permissions";

const integrations = [
  { href: "/admin/integracoes/scrapecreators", name: "ScrapeCreators", description: "Consultas públicas do Instagram, testes técnicos, execuções e consumo de créditos.", permission: "provider_poc.view" as const, status: () => Boolean(process.env.SCRAPECREATORS_API_KEY && process.env.SCRAPECREATORS_POC_ENABLED === "true") },
  { href: "/admin/integracoes/openai", name: "OpenAI", description: "Interpretação assistida por IA, modelo configurado, controles e histórico de execuções.", permission: "ai_integration.view" as const, status: () => Boolean(process.env.OPENAI_API_KEY && process.env.OPENAI_AI_ANALYSIS_ENABLED === "true") },
  { href: "/admin/integracoes/turnstile", name: "Turnstile", description: "Proteção anti-bot dos formulários públicos com validação pelo Cloudflare.", permission: "settings.manage" as const, status: () => Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY) },
];

export default async function IntegrationsPage() {
  const session = await requireAdminSession("dashboard.view");
  const visible = integrations.filter((integration) => hasPermission(session.profile.role, integration.permission));
  return <><AdminPageHeader eyebrow="OPERAÇÃO" title="Integrações" description="Acompanhe provedores externos, configurações seguras e históricos técnicos em um único lugar." />
    <section className="admin-integration-grid">{visible.map((integration) => <article className="admin-integration-card" key={integration.href}><header><span className={`admin-resource-state ${integration.status() ? "is-enabled" : ""}`} aria-hidden="true" /><div><strong>{integration.name}</strong><small>{integration.status() ? "Configurada no ambiente" : "Configuração incompleta"}</small></div></header><p>{integration.description}</p><Link className="admin-secondary-button" href={integration.href}>Abrir integração <span aria-hidden="true">→</span></Link></article>)}</section>
    {!visible.length && <section className="admin-panel admin-empty"><strong>Nenhuma integração disponível</strong><p>Seu perfil não possui permissão para consultar integrações administrativas.</p></section>}
  </>;
}
