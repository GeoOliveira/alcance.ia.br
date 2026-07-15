import { AdminActionForm } from "@/components/admin/admin-action-form";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { updateFeatureFlagAction } from "@/app/admin/actions/operations";
import { requireAdminSession } from "@/lib/admin/auth";
import { getProductResourcesAdminData } from "@/lib/admin/data";
import { deleteContentCategoryAction, runHashtagDiscoveryAction, saveContentCategoryAction, updateDashboardModuleAction, updateProductFeatureAction } from "./actions";

type FeatureRow = { key: string; name: string; description: string; feature_group: string; audience: string; status: string; visibility: string; enabled: boolean; requires_provider_call: boolean; provider: string; dependencies: string[]; estimated_credit_cost: number; limits: Record<string, number>; metadata: Record<string, unknown>; updated_at: string; updated_by: string | null };
type CategoryRow = { id: string; slug: string; name: string; description: string; keywords: string[]; seed_hashtags: string[]; excluded_terms: string[]; language: string; country: string; enabled: boolean; visible: boolean; refresh_minutes: number; position: number };
type DashboardModuleRow = { key: string; title: string; description: string; icon: string; chart_type: string; enabled: boolean; visible: boolean; access_level: string; status: string; display_order: number; requires_ai: boolean; requires_authentication: boolean; requires_premium: boolean; configuration: { minimumData?: number; dependencies?: string[] }; updated_at: string; updated_by: string | null };
type DashboardFlagRow = { id: string; key: string; name: string; enabled: boolean };
type HashtagRunRow = { id: string; status: string; items_count: number; provider_calls: number; period: string | null; error_code: string | null; created_at: string; completed_at: string | null; content_categories: { name: string } | { name: string }[] | null };

const groupLabels: Record<string, string> = { profile: "Análise de perfil", category: "Descoberta por categoria", trending: "Tendências", audio: "Áudios" };
const statusLabels: Record<string, string> = { disabled: "Desativado", development: "Desenvolvimento", beta: "Beta", active: "Produção" };
const audienceLabels: Record<string, string> = { public: "Público", free: "Gratuito", premium: "Premium", admin: "Administrativo" };

function DashboardModuleEditor({ module }: { module: DashboardModuleRow }) {
  return <details className="admin-resource-item">
    <summary>
      <span className={`admin-resource-state ${module.enabled && module.visible ? "is-enabled" : ""}`} aria-label={module.enabled && module.visible ? "Habilitado e visível" : "Indisponível"} />
      <div className="admin-resource-title"><strong>{module.title}</strong><small>{module.key} · {module.chart_type}</small></div>
      <div className="admin-resource-badges"><span data-tone={module.status}>{statusLabels[module.status] || module.status}</span><span>{audienceLabels[module.access_level] || module.access_level}</span>{module.requires_ai && <span>Usa IA</span>}{module.requires_premium && <span data-tone="cost">Premium</span>}</div>
      <div className="admin-resource-metrics"><span><b>{module.display_order}</b> ordem</span><span><b>{module.configuration.minimumData ?? 1}</b> dados mínimos</span></div><i aria-hidden="true">⌄</i>
    </summary>
    <div className="admin-resource-editor">
      <div className="admin-resource-description"><p>{module.description}</p><dl><div><dt>Tipo de gráfico</dt><dd>{module.chart_type}</dd></div><div><dt>Última alteração</dt><dd>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(module.updated_at))}</dd></div><div><dt>Responsável</dt><dd>{module.updated_by || "Seed do sistema"}</dd></div></dl></div>
      <AdminActionForm action={updateDashboardModuleAction} className="admin-form admin-resource-form" submitLabel="Salvar módulo">
        <input type="hidden" name="key" value={module.key} />
        <fieldset><legend>Conteúdo e organização</legend><label>Título<input name="title" defaultValue={module.title} minLength={3} maxLength={120} required /></label><label>Descrição<input name="description" defaultValue={module.description} maxLength={500} /></label><div><label>Ícone<input name="icon" defaultValue={module.icon} minLength={2} maxLength={40} required /></label><label>Ordem<input name="displayOrder" type="number" min={0} max={10000} defaultValue={module.display_order} /></label><label>Dados mínimos<input name="minimumData" type="number" min={1} max={100} defaultValue={module.configuration.minimumData ?? 1} /></label></div></fieldset>
        <fieldset><legend>Disponibilidade e acesso</legend><div><label>Estado<select name="status" defaultValue={module.status}><option value="disabled">Desativado</option><option value="development">Desenvolvimento</option><option value="beta">Beta</option><option value="active">Produção</option></select></label><label>Acesso<select name="accessLevel" defaultValue={module.access_level}><option value="public">Público</option><option value="free">Gratuito com conta</option><option value="premium">Premium</option><option value="admin">Administrativo</option></select></label><label>Habilitado<select name="enabled" defaultValue={String(module.enabled)}><option value="false">Não</option><option value="true">Sim</option></select></label><label>Visível<select name="visible" defaultValue={String(module.visible)}><option value="false">Não</option><option value="true">Sim</option></select></label></div></fieldset>
        <fieldset><legend>Requisitos e dependências</legend><div><label>Requer IA<select name="requiresAI" defaultValue={String(module.requires_ai)}><option value="false">Não</option><option value="true">Sim</option></select></label><label>Requer autenticação<select name="requiresAuthentication" defaultValue={String(module.requires_authentication)}><option value="false">Não</option><option value="true">Sim</option></select></label><label>Requer Premium<select name="requiresPremium" defaultValue={String(module.requires_premium)}><option value="false">Não</option><option value="true">Sim</option></select></label></div><label>Dependências<input name="dependencies" defaultValue={(module.configuration.dependencies ?? []).join(", ")} placeholder="Chaves separadas por vírgula" /></label></fieldset>
        <label className="admin-critical-confirm">Confirmação para mudanças críticas<input name="confirmation" placeholder="Digite ATIVAR quando solicitado" autoComplete="off" /><small>Necessária ao publicar, ativar beta, exigir IA ou Premium, aumentar o mínimo de dados ou alterar dependências.</small></label>
      </AdminActionForm>
    </div>
  </details>;
}

function FeatureEditor({ feature, interestCount }: { feature: FeatureRow; interestCount: number }) {
  return <details className="admin-resource-item">
    <summary>
      <span className={`admin-resource-state ${feature.enabled ? "is-enabled" : ""}`} aria-label={feature.enabled ? "Habilitado" : "Desabilitado"} />
      <div className="admin-resource-title"><strong>{feature.name}</strong><small>{feature.key}</small></div>
      <div className="admin-resource-badges"><span data-tone={feature.status}>{statusLabels[feature.status] || feature.status}</span><span>{audienceLabels[feature.audience] || feature.audience}</span>{feature.requires_provider_call && <span data-tone="cost">Usa provedor</span>}</div>
      <div className="admin-resource-metrics"><span><b>{feature.limits.maxItems ?? 0}</b> itens</span><span><b>{interestCount}</b> interessados</span></div>
      <i aria-hidden="true">⌄</i>
    </summary>
    <div className="admin-resource-editor">
      <div className="admin-resource-description"><p>{feature.description}</p><dl><div><dt>Provedor</dt><dd>{feature.provider}</dd></div><div><dt>Custo estimado</dt><dd>{feature.estimated_credit_cost} crédito(s)</dd></div><div><dt>Última alteração</dt><dd>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(feature.updated_at))}</dd></div><div><dt>Responsável</dt><dd>{feature.updated_by || "Seed do sistema"}</dd></div></dl></div>
      <AdminActionForm action={updateProductFeatureAction} className="admin-form admin-resource-form" submitLabel="Salvar recurso">
        <input type="hidden" name="key" value={feature.key} />
        <fieldset><legend>Disponibilidade e acesso</legend><div>
          <label>Estado<select name="status" defaultValue={feature.status}><option value="disabled">Desativado</option><option value="development">Desenvolvimento</option><option value="beta">Beta</option><option value="active">Produção</option></select></label>
          <label>Acesso<select name="audience" defaultValue={feature.audience}><option value="public">Público</option><option value="free">Gratuito com conta</option><option value="premium">Premium</option><option value="admin">Administrativo</option></select></label>
          <label>Visibilidade<select name="visibility" defaultValue={feature.visibility}><option value="hidden">Oculto</option><option value="preview">Preview</option><option value="full">Completo</option></select></label>
          <label>Habilitado<select name="enabled" defaultValue={String(feature.enabled)}><option value="false">Não</option><option value="true">Sim</option></select></label>
        </div></fieldset>
        <fieldset><legend>Limites e operação</legend><div>
          <label>Máximo de itens<input name="maxItems" type="number" min={1} max={100} defaultValue={feature.limits.maxItems ?? 5} /></label>
          <label>Chamadas por dia<input name="dailyRequests" type="number" min={0} max={10000} defaultValue={feature.limits.dailyRequests ?? 0} /></label>
          <label>Cache em minutos<input name="cacheMinutes" type="number" min={0} max={10080} defaultValue={feature.limits.cacheMinutes ?? 0} /></label>
          <label>Custo em créditos<input name="estimatedCreditCost" type="number" min={0} max={10000} step="0.01" defaultValue={feature.estimated_credit_cost} /></label>
        </div><label>Dependências<input name="dependencies" defaultValue={feature.dependencies.join(", ")} placeholder="Chaves separadas por vírgula" /></label></fieldset>
        {["resource_hashtags", "resource_trending_reels", "resource_reels_by_category"].includes(feature.key) && <fieldset><legend>Publicação da ferramenta</legend><div><label>Atualização automática<select name="automaticRefresh" defaultValue={String(feature.metadata.automaticRefresh === true)}><option value="false">Desativada</option><option value="true">Ativada</option></select></label><label>Indexação em buscadores<select name="indexable" defaultValue={String(feature.metadata.indexable !== false)}><option value="true">Permitida</option><option value="false">Bloqueada</option></select></label></div>{feature.key === "resource_reels_by_category" && <div><label>Países habilitados<input name="enabledCountries" defaultValue={Array.isArray(feature.metadata.enabledCountries) ? feature.metadata.enabledCountries.join(", ") : "BR"} placeholder="BR, PT" /></label><label>Idiomas habilitados<input name="enabledLanguages" defaultValue={Array.isArray(feature.metadata.enabledLanguages) ? feature.metadata.enabledLanguages.join(", ") : "pt-BR"} placeholder="pt-BR, en-US" /></label></div>}<p className="admin-note">A página pública lê somente snapshots válidos. Ativar atualização automática não faz a navegação pública consultar o provedor.</p></fieldset>}
        <label className="admin-critical-confirm">Confirmação para mudanças críticas<input name="confirmation" placeholder="Digite ATIVAR quando solicitado" autoComplete="off" /><small>Necessária ao ativar beta ou provedor, aumentar consumo, alterar dependências, tornar premium ou desativar um recurso público.</small></label>
      </AdminActionForm>
    </div>
  </details>;
}

function CategoryForm({ category }: { category?: CategoryRow }) {
  return <AdminActionForm action={saveContentCategoryAction} className="admin-form admin-resource-form" submitLabel={category ? "Salvar categoria" : "Criar categoria"}>
    <input type="hidden" name="id" value={category?.id || ""} />
    <fieldset><legend>Identificação</legend><div><label>Slug<input name="slug" defaultValue={category?.slug} pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={80} required /></label><label>Nome<input name="name" defaultValue={category?.name} minLength={2} maxLength={80} required /></label></div><label>Descrição<input name="description" defaultValue={category?.description} maxLength={500} /></label></fieldset>
    <fieldset><legend>Critérios de descoberta</legend><label>Palavras-chave<input name="keywords" defaultValue={category?.keywords.join(", ")} maxLength={500} /></label><label>Hashtags-semente<input name="seedHashtags" defaultValue={category?.seed_hashtags.join(", ")} maxLength={500} /></label><label>Termos excluídos<input name="excludedTerms" defaultValue={category?.excluded_terms.join(", ")} maxLength={500} /></label></fieldset>
    <fieldset><legend>Publicação e atualização</legend><div><label>Idioma<input name="language" defaultValue={category?.language || "pt-BR"} required /></label><label>País<input name="country" defaultValue={category?.country || "BR"} required /></label><label>Atualização (min)<input name="refreshMinutes" type="number" min={60} max={10080} defaultValue={category?.refresh_minutes ?? 1440} /></label><label>Posição<input name="position" type="number" min={0} max={10000} defaultValue={category?.position ?? 100} /></label><label>Habilitada<select name="enabled" defaultValue={String(category?.enabled ?? false)}><option value="false">Não</option><option value="true">Sim</option></select></label><label>Visível<select name="visible" defaultValue={String(category?.visible ?? false)}><option value="false">Não</option><option value="true">Sim</option></select></label></div></fieldset>
    {category ? <label className="admin-critical-confirm">Confirmação para habilitar<input name="confirmation" placeholder="Digite ATIVAR ao habilitar" autoComplete="off" /></label> : <input type="hidden" name="confirmation" value="" />}
  </AdminActionForm>;
}

export default async function ProductResourcesPage({ searchParams }: { searchParams: Promise<{ status?: string; audience?: string; enabled?: string }> }) {
  await requireAdminSession("features.manage");
  const [data, filters] = await Promise.all([getProductResourcesAdminData(), searchParams]);
  const allFeatures = data.features as FeatureRow[];
  const categories = data.categories as CategoryRow[];
  const dashboardModules = data.dashboardModules as DashboardModuleRow[];
  const dashboardFlags = data.dashboardFlags as DashboardFlagRow[];
  const hashtagRuns = data.hashtagRuns as HashtagRunRow[];
  const hashtagFeature = allFeatures.find((feature) => feature.key === "category_hashtag_discovery");
  const resourceFlags = dashboardFlags.filter((flag) => flag.key === "resource_reels_by_category");
  const executiveFlags = dashboardFlags.filter((flag) => flag.key.startsWith("dashboard_"));
  const features = allFeatures.filter((feature) => (!filters.status || feature.status === filters.status) && (!filters.audience || feature.audience === filters.audience) && (!filters.enabled || String(feature.enabled) === filters.enabled));
  const totalInterest = Object.values(data.interestCounts).reduce((sum, count) => sum + count, 0);
  return <>
    <AdminPageHeader eyebrow="PRODUTO" title="Recursos do produto" description="Controle disponibilidade, acesso e limites sem perder a visão geral do catálogo." />
    <div className="admin-stat-grid admin-resource-stats"><article className="admin-stat-card"><span>Recursos cadastrados</span><strong>{allFeatures.length}</strong><small>{allFeatures.filter((feature) => feature.enabled).length} habilitados</small></article><article className="admin-stat-card"><span>Módulos do dashboard</span><strong>{dashboardModules.length}</strong><small>{dashboardModules.filter((module) => module.enabled && module.visible).length} publicados</small></article><article className="admin-stat-card"><span>Premium</span><strong>{allFeatures.filter((feature) => feature.audience === "premium").length + dashboardModules.filter((module) => module.access_level === "premium").length}</strong><small>Recursos e módulos controlados</small></article><article className="admin-stat-card"><span>Interesses registrados</span><strong>{totalInterest}</strong><small>Sinais deduplicados</small></article></div>
    <section className="admin-panel admin-resource-panel">
      <div className="admin-panel-header"><div><h2>Dashboard Executivo</h2><p>Controle a composição visual exibida no início do resultado da análise.</p></div></div>
      <div className="admin-dashboard-flags" aria-label="Flags do dashboard">{executiveFlags.map((flag) => <AdminActionForm action={updateFeatureFlagAction} className="admin-dashboard-flag" submitLabel="Aplicar" key={flag.key}><input type="hidden" name="id" value={flag.id} /><span>{flag.name}<small>{flag.key}</small></span><select name="enabled" defaultValue={String(flag.enabled)} aria-label={`Estado de ${flag.name}`}><option value="true">Ativa</option><option value="false">Inativa</option></select></AdminActionForm>)}</div>
      <div className="admin-resource-groups"><section><header><h3>Módulos visuais</h3><span>{dashboardModules.length}</span></header><div>{dashboardModules.map((module) => <DashboardModuleEditor key={module.key} module={module} />)}</div></section></div>
    </section>
    <section className="admin-panel admin-resource-panel">
      <div className="admin-panel-header"><div><h2>Reels por categoria</h2><p>Feature flag pública e atalho para a administração das categorias.</p></div><a className="admin-secondary-button" href="/admin/categorias">Administrar categorias</a></div>
      <div className="admin-dashboard-flags">{resourceFlags.map((flag) => <AdminActionForm action={updateFeatureFlagAction} className="admin-dashboard-flag" submitLabel="Aplicar" key={flag.key}><input type="hidden" name="id" value={flag.id} /><span>{flag.name}<small>{flag.key}</small></span><select name="enabled" defaultValue={String(flag.enabled)}><option value="true">Ativa</option><option value="false">Inativa</option></select></AdminActionForm>)}</div>
    </section>
    <section className="admin-panel admin-resource-panel admin-hashtag-collector">
      <div className="admin-panel-header"><div><h2>Atualização das hashtags públicas</h2><p>Consulta amostras públicas por categoria e publica somente resultados agregados no cache.</p></div><a className="admin-secondary-button" href="/recursos/hashtags">Abrir página pública</a></div>
      <div className="admin-hashtag-layout">
        <AdminActionForm action={runHashtagDiscoveryAction} className="admin-form admin-resource-form" submitLabel="Atualizar hashtags" pendingLabel="Coletando hashtags…">
          <div className="admin-hashtag-callout"><strong>Consumo controlado</strong><span>Limite configurado: {hashtagFeature?.limits.dailyRequests ?? 0} chamadas/dia · custo estimado: {hashtagFeature?.estimated_credit_cost ?? 0} crédito por chamada.</span></div>
          <fieldset><legend>Escopo desta atualização</legend><div><label>Categorias<input name="categoryLimit" type="number" min={1} max={10} defaultValue={5} /></label><label>Sementes por categoria<select name="seedsPerCategory" defaultValue="2"><option value="1">1 semente</option><option value="2">2 sementes</option><option value="3">3 sementes</option></select></label><label>Período do provedor<select name="period" defaultValue="last-month"><option value="last-week">Última semana</option><option value="last-month">Último mês</option><option value="last-year">Último ano</option></select></label></div></fieldset>
          <label className="admin-critical-confirm">Confirmação<input name="confirmation" placeholder="Digite COLETAR HASHTAGS" autoComplete="off" /><small>A página pública nunca dispara esta consulta. A ação respeita o limite diário configurado e substitui a leitura somente após salvar um novo snapshot.</small></label>
        </AdminActionForm>
        <div className="admin-hashtag-history"><h3>Execuções recentes</h3>{hashtagRuns.length ? <div>{hashtagRuns.map((run) => { const relation = Array.isArray(run.content_categories) ? run.content_categories[0] : run.content_categories; return <article key={run.id}><span className={`admin-status admin-status-${run.status}`}>{run.status}</span><div><strong>{relation?.name ?? "Categoria removida"}</strong><small>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(run.created_at))} · {run.period ?? "sem período"}</small></div><b>{run.items_count} itens<small>{run.provider_calls} chamada(s){run.error_code ? ` · ${run.error_code}` : ""}</small></b></article>; })}</div> : <div className="admin-empty"><strong>Nenhuma execução registrada</strong><p>Inicie uma atualização para formar o primeiro snapshot.</p></div>}</div>
      </div>
    </section>
    <section className="admin-panel admin-resource-panel">
      <div className="admin-panel-header"><div><h2>Catálogo de recursos</h2><p>{features.length} de {allFeatures.length} recursos exibidos</p></div></div>
      <form className="admin-filter-form admin-resource-filters" method="get"><label>Estado<select name="status" defaultValue={filters.status || ""}><option value="">Todos</option><option value="development">Desenvolvimento</option><option value="beta">Beta</option><option value="active">Produção</option><option value="disabled">Desativado</option></select></label><label>Acesso<select name="audience" defaultValue={filters.audience || ""}><option value="">Todos</option><option value="public">Público</option><option value="free">Gratuito</option><option value="premium">Premium</option><option value="admin">Administrativo</option></select></label><label>Disponibilidade<select name="enabled" defaultValue={filters.enabled || ""}><option value="">Todos</option><option value="true">Habilitados</option><option value="false">Desabilitados</option></select></label><button className="admin-secondary-button" type="submit">Aplicar filtros</button></form>
      <div className="admin-resource-groups">{Object.entries(groupLabels).map(([group, label]) => { const rows = features.filter((feature) => feature.feature_group === group); if (!rows.length) return null; return <section key={group}><header><h3>{label}</h3><span>{rows.length}</span></header><div>{rows.map((feature) => <FeatureEditor key={feature.key} feature={feature} interestCount={data.interestCounts[feature.key] ?? 0} />)}</div></section>; })}</div>
      {!features.length && <div className="admin-empty"><strong>Nenhum recurso encontrado</strong><p>Revise os filtros selecionados.</p></div>}
    </section>
    <section className="admin-panel admin-resource-panel">
      <div className="admin-panel-header"><div><h2>Categorias de descoberta</h2><p>{categories.length} categorias cadastradas · nenhuma é ativada automaticamente</p></div></div>
      <div className="admin-resource-groups"><section><div>
        <details className="admin-resource-item admin-resource-create"><summary><span className="admin-resource-add">+</span><div className="admin-resource-title"><strong>Nova categoria</strong><small>Criar uma configuração controlada</small></div><i aria-hidden="true">⌄</i></summary><div className="admin-resource-editor"><CategoryForm /></div></details>
        {categories.map((category) => <details className="admin-resource-item" key={category.id}><summary><span className={`admin-resource-state ${category.enabled ? "is-enabled" : ""}`} /><div className="admin-resource-title"><strong>{category.name}</strong><small>/descobrir/{category.slug}</small></div><div className="admin-resource-badges"><span>{category.language}</span><span>{category.country}</span><span data-tone={category.visible ? "active" : "disabled"}>{category.visible ? "Visível" : "Oculta"}</span></div><div className="admin-resource-metrics"><span><b>{category.position}</b> posição</span><span><b>{category.refresh_minutes}</b> min</span></div><i aria-hidden="true">⌄</i></summary><div className="admin-resource-editor"><CategoryForm category={category} /><div className="admin-resource-danger"><strong>Excluir categoria</strong><p>Use apenas se ela não deve permanecer no catálogo.</p><AdminActionForm action={deleteContentCategoryAction} className="admin-form admin-inline-form" submitLabel="Excluir categoria"><input type="hidden" name="id" value={category.id} /><input type="hidden" name="slug" value={category.slug} /><label>Confirmação<input name="confirmation" placeholder={`EXCLUIR ${category.slug}`} autoComplete="off" /></label></AdminActionForm></div></div></details>)}
      </div></section></div>
    </section>
  </>;
}
