import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { requireAdminSession } from "@/lib/admin/auth";
import { getEncurtaConfig } from "@/lib/integrations/encurta/config";
import { maskRequestId } from "@/lib/integrations/encurta/observability";
import { createAdminClient } from "@/lib/supabase/admin";

const FLAG_KEYS = [
  "encurta_integration",
  "whatsapp_link_shortener",
  "whatsapp_link_shortener_anonymous",
  "whatsapp_link_shortener_free",
  "whatsapp_link_shortener_premium",
  "whatsapp_link_shortener_share",
  "whatsapp_link_shortener_history",
] as const;

type Flag = { key: string; enabled: boolean };
type Setting = { key: string; value: unknown };
type Event = { request_id: string; status: string; http_status: number; duration_ms: number; error_code: string | null; retry_count: number; idempotent_replay: boolean; created_at: string };

export default async function WhatsAppGeneratorAdminPage() {
  await requireAdminSession("features.manage");
  const supabase = createAdminClient();
  const today = new Date(); today.setUTCHours(0, 0, 0, 0);
  const [flagsResult, settingsResult, eventsResult] = supabase ? await Promise.all([
    supabase.from("feature_flags").select("key,enabled").in("key", [...FLAG_KEYS]),
    supabase.from("app_settings").select("key,value").like("key", "whatsapp_link_shortener.%"),
    supabase.from("whatsapp_shortener_events").select("request_id,status,http_status,duration_ms,error_code,retry_count,idempotent_replay,created_at").gte("created_at", today.toISOString()).order("created_at", { ascending: false }).limit(200),
  ]) : [{ data: [], error: new Error("not_configured") }, { data: [], error: new Error("not_configured") }, { data: [], error: new Error("not_configured") }];
  const flags = ((flagsResult.data || []) as Flag[]).sort((a, b) => a.key.localeCompare(b.key));
  const settings = ((settingsResult.data || []) as Setting[]).sort((a, b) => a.key.localeCompare(b.key));
  const events = (eventsResult.data || []) as Event[];
  const successes = events.filter((event) => event.status === "succeeded");
  const failures = events.filter((event) => event.status !== "succeeded");
  const lastEvent = events[0];
  const lastSuccess = successes[0];
  const lastFailure = failures[0];
  const config = getEncurtaConfig();
  const flagMap = new Map(flags.map((flag) => [flag.key, flag.enabled]));

  return <>
    <AdminPageHeader eyebrow="INTEGRAÇÕES" title="Gerador de Link WhatsApp" description="Diagnóstico seguro do encurtador Encurta.io e das barreiras de publicação." />
    <div className="admin-stat-grid">
      <article className="admin-stat-card"><span>Integração</span><strong>{config.enabled ? "Ativa" : "Desativada"}</strong><small>{config.configured ? "Configuração completa" : "Configuração incompleta"}</small></article>
      <article className="admin-stat-card"><span>Flags efetivas</span><strong>{FLAG_KEYS.filter((key) => flagMap.get(key)).length}/{FLAG_KEYS.length}</strong><small>Devem ser habilitadas gradualmente</small></article>
      <article className="admin-stat-card"><span>Ambiente</span><strong>{process.env.VERCEL_ENV || process.env.NODE_ENV}</strong><small>Segredos nunca exibidos</small></article>
      <article className="admin-stat-card"><span>Links hoje</span><strong>{successes.length}</strong><small>{failures.length} falhas · {events.filter((event) => event.error_code === "timeout").length} timeouts</small></article>
    </div>
    <section className="admin-panel">
      <div className="admin-panel-header"><div><h2>Barreiras de ativação</h2><p>O encurtamento só funciona quando a integração, a flag pública e o metadata do recurso estão ativos.</p></div><div><Link className="admin-secondary-button" href="/admin/recursos">Editar recurso</Link> <Link className="admin-secondary-button" href="/admin/recursos/whatsapp_link_generator/testar">Testar</Link></div></div>
      <dl className="admin-details"><dt>ENCURTA_INTEGRATION_ENABLED</dt><dd>{config.enabled ? "true" : "false"}</dd><dt>API key</dt><dd>{config.apiKey ? "configurada" : "não configurada"}</dd><dt>HMAC</dt><dd>{config.hmacSecret ? "configurado" : "não configurado"}</dd><dt>URL da API</dt><dd>{config.apiUrl}</dd><dt>Contrato</dt><dd>Internal API v1 · OpenAPI 1.0.0</dd><dt>Timeout e retry</dt><dd>{config.timeoutMs} ms · {config.maxRetries} retry</dd>{FLAG_KEYS.map((key) => <span key={key}><dt>{key}</dt><dd>{flagMap.get(key) ? "ativa" : "inativa"}</dd></span>)}</dl>
    </section>
    <section className="admin-panel">
      <div className="admin-panel-header"><div><h2>Limites e comportamento</h2><p>Valores lidos do banco; nenhuma alteração é feita por esta tela.</p></div><Link className="admin-secondary-button" href="/admin/configuracoes">Configurações</Link></div>
      {settings.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Chave</th><th>Valor</th></tr></thead><tbody>{settings.map((setting) => <tr key={setting.key}><td>{setting.key}</td><td>{typeof setting.value === "object" ? JSON.stringify(setting.value) : String(setting.value)}</td></tr>)}</tbody></table></div> : <p className="admin-note">A migration de configurações ainda não foi aplicada.</p>}
    </section>
    <section className="admin-panel">
      <div className="admin-panel-header"><div><h2>Saúde e atividade</h2><p>Metadados sanitizados; telefone, mensagem e URLs nunca são registrados.</p></div></div>
      {eventsResult.error ? <p className="admin-note">A migration de observabilidade ainda não foi aplicada.</p> : <><dl className="admin-details"><dt>Estado</dt><dd>{!config.enabled ? "Desativado" : !config.configured ? "Não configurado" : lastFailure && (!lastSuccess || lastFailure.created_at > lastSuccess.created_at) ? "Atenção" : "Operacional"}</dd><dt>Última verificação</dt><dd>{lastEvent ? new Date(lastEvent.created_at).toLocaleString("pt-BR") : "sem eventos"}</dd><dt>Último sucesso</dt><dd>{lastSuccess ? `${new Date(lastSuccess.created_at).toLocaleString("pt-BR")} · ${lastSuccess.duration_ms} ms` : "—"}</dd><dt>Último erro</dt><dd>{lastFailure ? `${lastFailure.error_code || lastFailure.http_status} · ${new Date(lastFailure.created_at).toLocaleString("pt-BR")}` : "—"}</dd></dl>{events.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Data</th><th>Request</th><th>Status</th><th>Duração</th><th>Retries</th><th>Replay</th></tr></thead><tbody>{events.slice(0, 20).map((event) => <tr key={`${event.request_id}-${event.created_at}`}><td>{new Date(event.created_at).toLocaleString("pt-BR")}</td><td>{maskRequestId(event.request_id)}</td><td>{event.error_code || event.status}</td><td>{event.duration_ms} ms</td><td>{event.retry_count}</td><td>{event.idempotent_replay ? "sim" : "não"}</td></tr>)}</tbody></table></div> : <p className="admin-note">Nenhuma operação registrada hoje.</p>}</>}
    </section>
  </>;
}
