import { AdminActionForm } from "@/components/admin/admin-action-form";
import { AdminEmptyState, AdminPageHeader } from "@/components/admin/admin-ui";
import { updateFeatureFlagAction, updateSettingAction } from "@/app/admin/actions/operations";
import { requireAdminSession } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { getGoogleAuthPublicConfig, getSupabaseGoogleProviderStatus } from "@/lib/auth/google-config";
import { siteConfig } from "@/config/site";
import type { AppSetting, FeatureFlag } from "@/types/admin";

const settingKeys = ["auth.google_client_id", "auth.google_authorized_origins"];
const flagKeys = ["whatsapp_manager_google_login", "whatsapp_manager_google_one_tap"];

function settingValue(setting: AppSetting) {
  return typeof setting.value === "string" ? setting.value : JSON.stringify(setting.value, null, 2);
}

export default async function GoogleIntegrationPage() {
  await requireAdminSession("settings.manage");
  const supabase = await createClient();
  const [settingsResult, flagsResult, runtime, providerStatus] = await Promise.all([
    supabase.from("app_settings").select("id,key,value,value_type,category,label,description,is_public,is_editable,validation_schema,created_at,updated_at,updated_by").in("key", settingKeys),
    supabase.from("feature_flags").select("id,key,name,description,enabled,scope,configuration,created_at,updated_at,updated_by").in("key", flagKeys),
    getGoogleAuthPublicConfig(),
    getSupabaseGoogleProviderStatus(),
  ]);
  const settings = (settingsResult.data || []) as AppSetting[];
  const flags = (flagsResult.data || []) as FeatureFlag[];
  const setting = (key: string) => settings.find((item) => item.key === key);
  const clientId = setting("auth.google_client_id");
  const origins = setting("auth.google_authorized_origins");
  const loginEnabled = Boolean(flags.find((flag) => flag.key === "whatsapp_manager_google_login")?.enabled);
  const oneTapEnabled = Boolean(flags.find((flag) => flag.key === "whatsapp_manager_google_one_tap")?.enabled);
  const providerReady = providerStatus.available && providerStatus.enabled;
  const integrationReady = Boolean(runtime.clientId && providerReady && loginEnabled);
  const siteUrl = siteConfig.url.replace(/\/$/, "");
  let supabaseCallback = "Configure NEXT_PUBLIC_SUPABASE_URL";
  try {
    supabaseCallback = `${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "").origin}/auth/v1/callback`;
  } catch {}

  const statusCards = [
    { label: "Google Client ID", value: runtime.clientId ? "Configurado" : "Pendente", detail: `Fonte: ${runtime.source === "admin" ? "Admin" : runtime.source === "environment" ? "variável de ambiente" : "nenhuma"}`, ready: Boolean(runtime.clientId) },
    { label: "Provider no Supabase", value: providerStatus.available ? (providerStatus.enabled ? "Ativo" : "Inativo") : "Indisponível", detail: providerStatus.enabled ? "Aceitando tokens Google" : "Habilite Google e informe Client ID/Secret", ready: providerReady },
    { label: "Login Google", value: loginEnabled ? "Ativo" : "Inativo", detail: "Controlado por feature flag", ready: loginEnabled },
    { label: "Google One Tap", value: oneTapEnabled ? "Ativo" : "Inativo", detail: "Ative somente após homologação", ready: oneTapEnabled },
  ];

  return <div className="admin-google-page">
    <AdminPageHeader eyebrow="INTEGRAÇÃO" title="Google" description="Configure o Google Identity Services, acompanhe o provider e valide os endereços usados em produção." />

    <section className="admin-google-readiness" data-state={integrationReady ? "ready" : "attention"}>
      <span className="admin-google-readiness-icon" aria-hidden="true">G</span>
      <div>
        <small>STATUS DA INTEGRAÇÃO</small>
        <strong>{integrationReady ? "Login com Google pronto para uso" : "A integração ainda precisa de atenção"}</strong>
        <p>{integrationReady ? "Client ID, provider e botão de login estão ativos." : "Revise os itens pendentes abaixo antes de liberar o acesso aos usuários."}</p>
      </div>
      <span className={`admin-status ${integrationReady ? "admin-status-completed" : "admin-status-pending"}`}>{integrationReady ? "Pronta" : "Revisar"}</span>
    </section>

    <div className="admin-stat-grid admin-google-overview">
      {statusCards.map((card) => <article className="admin-stat-card admin-google-status-card" data-state={card.ready ? "ready" : "pending"} key={card.label}>
        <span>{card.label}</span><strong>{card.value}</strong><small>{card.detail}</small>
      </article>)}
    </div>

    <div className="admin-google-content-grid">
      <section className="admin-panel admin-google-config-panel">
        <div className="admin-panel-header"><div><span className="admin-google-kicker">CREDENCIAIS PÚBLICAS</span><h2>Google Identity Services</h2><p>O Client ID pode ser atualizado sem um novo build. As origens documentam exatamente quais domínios devem ser autorizados no Google.</p></div></div>
        {clientId && origins ? <div className="admin-tool-grid">
          <AdminActionForm action={updateSettingAction} className="admin-form admin-resource-form admin-google-form" submitLabel="Salvar Client ID">
            <input type="hidden" name="id" value={clientId.id} /><input type="hidden" name="key" value={clientId.key} />
            <label>OAuth Client ID — aplicação Web<input name="value" defaultValue={settingValue(clientId)} placeholder="000000000000-abc.apps.googleusercontent.com" autoComplete="off" /><small>Identificador público criado no Google Auth Platform. Deixe vazio para usar o fallback de ambiente.</small></label>
          </AdminActionForm>
          <AdminActionForm action={updateSettingAction} className="admin-form admin-resource-form admin-google-form" submitLabel="Salvar origens">
            <input type="hidden" name="id" value={origins.id} /><input type="hidden" name="key" value={origins.key} />
            <label>Origens JavaScript autorizadas<textarea name="value" rows={7} defaultValue={settingValue(origins)} placeholder={'["http://localhost:3000","https://alcance.ia.br"]'} /><small>JSON com origens exatas, sem caminhos. O Google Auth Platform não é alterado automaticamente.</small></label>
          </AdminActionForm>
        </div> : <AdminEmptyState title="Migration de ferramentas pendente" message="Aplique a migration 202607200025_admin_tools_google_auth.sql para liberar os campos." />}
      </section>

      <section className="admin-panel admin-google-flags-panel">
        <div className="admin-panel-header"><div><span className="admin-google-kicker">LIBERAÇÃO</span><h2>Métodos de acesso</h2><p>Ative o botão primeiro. O One Tap deve ser liberado somente depois da homologação.</p></div></div>
        <div className="admin-dashboard-flags">{flags.map((flag) => <AdminActionForm action={updateFeatureFlagAction} className="admin-dashboard-flag" submitLabel="Aplicar" key={flag.key}>
          <input type="hidden" name="id" value={flag.id} /><span>{flag.name}<small>{flag.key}</small></span><select name="enabled" defaultValue={String(flag.enabled)}><option value="true">Ativa</option><option value="false">Inativa</option></select>
        </AdminActionForm>)}</div>
        <p className="admin-note">Mudanças afetam as páginas de entrada e criação de conta assim que o cache público for revalidado.</p>
      </section>
    </div>

    <section className="admin-panel admin-google-values-panel">
      <div className="admin-panel-header"><div><span className="admin-google-kicker">IMPLANTAÇÃO</span><h2>Valores corretos para produção</h2><p>Copie cada endereço para o campo indicado. Nenhuma configuração externa é alterada automaticamente.</p></div></div>
      <div className="admin-google-values-grid">
        <div className="admin-google-value-group"><h3>Google Auth Platform</h3><dl>
          <div><dt>Origem JavaScript de produção</dt><dd><code>{siteUrl}</code></dd></div>
          <div><dt>Origem JavaScript local</dt><dd><code>http://localhost:3000</code></dd></div>
          <div><dt>URI de redirecionamento OAuth</dt><dd><code>{supabaseCallback}</code></dd></div>
        </dl></div>
        <div className="admin-google-value-group"><h3>Supabase Authentication</h3><dl>
          <div><dt>Site URL</dt><dd><code>{siteUrl}</code></dd></div>
          <div><dt>Redirect URL de produção</dt><dd><code>{siteUrl}/auth/callback</code></dd></div>
          <div><dt>Redirect URL local</dt><dd><code>http://localhost:3000/auth/callback</code></dd></div>
        </dl></div>
      </div>
      <div className="admin-google-security"><span aria-hidden="true">🔒</span><div><strong>Segredo mantido fora da aplicação</strong><p><b>Client Secret:</b> Supabase Dashboard → Authentication → Providers → Google. <b>Escopos:</b> openid, email e profile.</p><p>O Client Secret nunca deve ser colocado em <code>app_settings</code>, HTML, logs ou variáveis <code>NEXT_PUBLIC_</code>.</p></div></div>
    </section>
  </div>;
}
