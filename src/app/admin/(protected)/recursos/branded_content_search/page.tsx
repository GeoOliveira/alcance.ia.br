import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { AdminActionForm } from "@/components/admin/admin-action-form";
import { requireAdminSession } from "@/lib/admin/auth";
import { getBrandedContentRuntime } from "@/lib/meta/branded-content/runtime";
import { isMetaConfigured } from "@/lib/meta/config";
import { isApifyConfigured } from "@/lib/providers/apify/client";
import { getBrandedContentProviderConfig } from "@/lib/branded-content/resolve-provider";
import { createClient } from "@/lib/supabase/server";
import { runProviderHealthCheckAction, updateBrandedContentProviderAction } from "./actions";
import "./branded-content-search.module.css";

type Run = { id: string; status: string; results_count: number; from_cache: boolean; duration_ms: number | null; error_code: string | null; created_at: string; provider_used: string | null; fallback_used: boolean; estimated_cost: number | null };

export default async function BrandedContentAdminPage() {
  const session = await requireAdminSession();
  const [runtime, config, supabase] = await Promise.all([getBrandedContentRuntime(), getBrandedContentProviderConfig(), createClient()]);
  const start = new Date(); start.setUTCHours(0, 0, 0, 0);
  const [{ data, error }, health] = await Promise.all([
    supabase.from("branded_content_search_runs").select("id,status,results_count,from_cache,duration_ms,error_code,created_at,provider_used,fallback_used,estimated_cost").gte("created_at", start.toISOString()).order("created_at", { ascending: false }).limit(100),
    supabase.from("branded_content_provider_health").select("provider,checked_at,available,code").order("provider"),
  ]);
  const runs = (data || []) as Run[];
  const success = runs.filter((run) => ["completed", "completed_with_warnings", "empty", "cache_hit"].includes(run.status));
  const average = runs.reduce((sum, run) => sum + (run.duration_ms || 0), 0) / Math.max(1, runs.filter((run) => run.duration_ms != null).length);
  const canManage = session.profile.role === "super_admin";

  return <><AdminPageHeader eyebrow="PROVEDORES DE DADOS" title="Pesquisa de Conteúdo de Marca" description="Meta oficial preservada, Apify isolada e seleção centralizada com fallback fechado por padrão." />
    <div className="branded-provider-admin">
      <div className="admin-stat-grid branded-provider-stats"><article className="admin-stat-card"><span>Modo atual</span><strong>{config.mode}</strong><small>{config.primary} → {config.fallback}</small></article><article className="admin-stat-card"><span>Configuração</span><strong>Meta {isMetaConfigured() ? "sim" : "não"} · Apify {isApifyConfigured() ? "sim" : "não"}</strong><small>segredos nunca exibidos</small></article><article className="admin-stat-card"><span>Taxa de sucesso</span><strong>{runs.length ? `${Math.round(success.length / runs.length * 100)}%` : "—"}</strong><small>{runs.filter((run) => run.fallback_used).length} fallbacks</small></article><article className="admin-stat-card"><span>Tempo médio</span><strong>{runs.length ? `${Math.round(average)} ms` : "—"}</strong><small>US$ {runs.reduce((sum, run) => sum + Number(run.estimated_cost || 0), 0).toFixed(4)} estimados hoje</small></article></div>

      <section className="admin-panel branded-provider-config"><div className="admin-panel-header"><div><span className="branded-provider-kicker">CONFIGURAÇÃO OPERACIONAL</span><h2>Provedor de dados</h2><p>A Apify cobra por resultados. Ativá-la como principal ou para o público pode gerar consumo externo.</p></div><div><Link className="admin-secondary-button" href="/admin/recursos/branded_content_search/testar">Testar</Link> <Link className="admin-secondary-button" href="/admin/recursos/branded_content_search/comparar">Comparar</Link></div></div>
        {canManage ? <AdminActionForm action={updateBrandedContentProviderAction} className="admin-form" submitLabel="Salvar configuração"><div className="admin-settings-grid branded-provider-settings"><label>Modo<select name="mode" defaultValue={config.mode}><option value="meta_only">Meta somente</option><option value="apify_only">Apify somente</option><option value="automatic_fallback">Fallback automático</option><option value="admin_compare">Comparação administrativa</option></select></label><label>Principal<select name="primary" defaultValue={config.primary}><option value="meta_official">Meta oficial</option><option value="apify">Apify</option></select></label><label>Fallback<select name="fallback" defaultValue={config.fallback}><option value="apify">Apify</option><option value="meta_official">Meta oficial</option></select></label><Toggle name="fallbackEnabled" label="Fallback" value={config.fallbackEnabled} /><Toggle name="fallbackOnEmpty" label="Fallback em vazio (gera custo)" value={config.fallbackOnEmpty} /><Toggle name="metaEnabled" label="Meta habilitada" value={config.metaEnabled} /><Toggle name="apifyEnabled" label="Apify habilitada" value={config.apifyEnabled} /><Toggle name="compareEnabled" label="Comparação dupla" value={config.comparisonEnabled} /><Toggle name="apifyAllowPublic" label="Apify para uso público" value={config.apifyAllowPublicUsage} /><NumberField name="maximumResults" label="Máximo geral" value={config.maximumResults} /><NumberField name="apifyResultsLimit" label="Limite Apify/run" value={config.apifyResultsLimit} /><NumberField name="apifyDailyRunLimit" label="Limite Apify/dia" value={config.apifyDailyRunLimit} /><NumberField name="metaCacheMinutes" label="Cache Meta (min)" value={config.metaCacheMinutes} /><NumberField name="apifyCacheMinutes" label="Cache Apify (min)" value={config.apifyCacheMinutes} /><label>Códigos elegíveis<input name="errorCodes" defaultValue={config.eligibleErrorCodes.join(",")} /></label><label className="admin-critical-confirm">Confirmação<input name="confirmation" placeholder="CONFIRMAR PROVEDOR" autoComplete="off" required /><small>Confirma troca de fonte, custos, limites e eventual consulta dupla.</small></label></div></AdminActionForm> : <p className="admin-note">Somente o superadministrador pode alterar estes controles.</p>}
      </section>

      <section className="admin-panel branded-provider-health"><div className="admin-panel-header"><div><span className="branded-provider-kicker">SEGURANÇA E DISPONIBILIDADE</span><h2>Barreiras e health check</h2><p>O health check da Apify consulta apenas a disponibilidade do Actor; não inicia uma run paga.</p></div><form action={runProviderHealthCheckAction}><button className="admin-secondary-button">Verificar agora</button></form></div><dl className="admin-details"><dt>Recurso</dt><dd>{runtime.enabled ? "Ativo" : "Bloqueado"}</dd><dt>Meta</dt><dd>{config.metaEnabled ? "Habilitada por setting + flag" : "Bloqueada"}</dd><dt>Apify</dt><dd>{config.apifyEnabled ? "Habilitada por setting + flag" : "Bloqueada"}</dd><dt>Fallback</dt><dd>{config.fallbackEnabled ? "Ativo" : "Inativo"}</dd><dt>Uso público Apify</dt><dd>{config.apifyAllowPublicUsage ? "Permitido" : "Bloqueado"}</dd>{(health.data || []).map((item) => <span key={item.provider}><dt>Último check {item.provider}</dt><dd>{item.available ? "Disponível" : item.code || "Indisponível"} · {new Date(item.checked_at).toLocaleString("pt-BR")}</dd></span>)}</dl></section>

      <section className="admin-panel branded-provider-runs"><div className="admin-panel-header"><div><span className="branded-provider-kicker">OBSERVABILIDADE</span><h2>Execuções recentes</h2></div></div>{error ? <p className="admin-note">A migration multiprovedor ainda não foi aplicada.</p> : runs.length ? <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Data</th><th>Provedor</th><th>Status</th><th>Resultados</th><th>Cache</th><th>Duração</th><th>Erro</th></tr></thead><tbody>{runs.slice(0, 20).map((run) => <tr key={run.id}><td>{new Date(run.created_at).toLocaleString("pt-BR")}</td><td>{run.provider_used || "—"}</td><td>{run.status}</td><td>{run.results_count}</td><td>{run.from_cache ? "sim" : "não"}</td><td>{run.duration_ms == null ? "—" : `${run.duration_ms} ms`}</td><td>{run.error_code || "—"}</td></tr>)}</tbody></table></div> : <p className="admin-note">Nenhuma execução hoje.</p>}</section>
    </div>
  </>;
}

function Toggle({ name, label, value }: { name: string; label: string; value: boolean }) { return <label>{label}<select name={name} defaultValue={String(value)}><option value="false">Desativado</option><option value="true">Ativado</option></select></label>; }
function NumberField({ name, label, value }: { name: string; label: string; value: number }) { return <label>{label}<input name={name} type="number" min="0" max="10080" defaultValue={value} /></label>; }
