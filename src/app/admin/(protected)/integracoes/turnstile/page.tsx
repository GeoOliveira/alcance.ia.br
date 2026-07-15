import { AdminPageHeader } from "@/components/admin/admin-ui";
import { requireAdminSession } from "@/lib/admin/auth";

export default async function TurnstileIntegrationPage() {
  await requireAdminSession("settings.manage");
  const siteKeyConfigured = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);
  const secretConfigured = Boolean(process.env.TURNSTILE_SECRET_KEY);
  const active = siteKeyConfigured && secretConfigured;
  return <><AdminPageHeader eyebrow="INTEGRAÇÃO" title="Turnstile" description="Proteção anti-bot dos formulários públicos por meio do Cloudflare Turnstile." />
    <section className="admin-grid-two"><article className="admin-panel"><h2>Estado da integração</h2><dl className="admin-details"><dt>Integração</dt><dd><span className={`admin-status ${active ? "admin-status-completed" : "admin-status-pending"}`}>{active ? "Ativa" : "Incompleta"}</span></dd><dt>Chave pública</dt><dd>{siteKeyConfigured ? "Configurada" : "Ausente"}</dd><dt>Chave secreta</dt><dd>{secretConfigured ? "Configurada" : "Ausente"}</dd><dt>Validação no servidor</dt><dd>{active ? "Habilitada" : "Desabilitada até configurar as duas chaves"}</dd></dl><p className="admin-note">As chaves são lidas somente do ambiente da Vercel e nunca são exibidas ou armazenadas no Supabase.</p></article>
      <article className="admin-panel"><h2>Formulários protegidos</h2><ul className="admin-integration-list"><li>Análise pública de perfil</li><li>Formulário de contato</li><li>Cadastro de interesse</li></ul><p className="admin-muted">Quando a integração está ativa, o token recebido no navegador é validado no servidor antes de processar a solicitação.</p></article></section>
  </>;
}
