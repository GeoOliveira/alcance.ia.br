import { AdminActionForm } from "@/components/admin/admin-action-form";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { requireAdminSession } from "@/lib/admin/auth";
import { getProductResourcesAdminData } from "@/lib/admin/data";
import { deleteContentCategoryAction, saveContentCategoryAction, updateProductFeatureAction } from "./actions";

type FeatureRow = { key: string; name: string; description: string; feature_group: string; audience: string; status: string; visibility: string; enabled: boolean; requires_provider_call: boolean; provider: string; dependencies: string[]; estimated_credit_cost: number; limits: Record<string, number>; updated_at: string; updated_by: string | null };
type CategoryRow = { id: string; slug: string; name: string; description: string; keywords: string[]; seed_hashtags: string[]; excluded_terms: string[]; language: string; country: string; enabled: boolean; visible: boolean; refresh_minutes: number; position: number };

export default async function ProductResourcesPage({ searchParams }: { searchParams: Promise<{ status?: string; audience?: string; enabled?: string }> }) {
  await requireAdminSession("features.manage");
  const [data, filters] = await Promise.all([getProductResourcesAdminData(), searchParams]);
  const features = (data.features as FeatureRow[]).filter((feature) => (!filters.status || feature.status === filters.status) && (!filters.audience || feature.audience === filters.audience) && (!filters.enabled || String(feature.enabled) === filters.enabled));
  return <>
    <AdminPageHeader eyebrow="PRODUTO" title="Recursos do produto" description="Catálogo central de acesso, visibilidade, dependências, custo estimado e limites. Recursos externos permanecem desligados até confirmação explícita." />
    <section className="admin-panel">
      <h2>Catálogo</h2>
      <form className="admin-filters" method="get">
        <label>Estado<select name="status" defaultValue={filters.status || ""}><option value="">Todos</option><option value="development">Desenvolvimento</option><option value="beta">Beta</option><option value="active">Produção</option><option value="disabled">Desativado</option></select></label>
        <label>Acesso<select name="audience" defaultValue={filters.audience || ""}><option value="">Todos</option><option value="public">Público</option><option value="free">Gratuito</option><option value="premium">Premium</option><option value="admin">Administrativo</option></select></label>
        <label>Disponibilidade<select name="enabled" defaultValue={filters.enabled || ""}><option value="">Todos</option><option value="true">Ativos</option><option value="false">Desativados</option></select></label>
        <button type="submit">Filtrar</button>
      </form>
      <div className="admin-settings-grid">{features.map((feature) => <article className="admin-setting" key={feature.key}>
        <div><h3>{feature.name}</h3><p>{feature.description}<br /><span className="admin-mono">{feature.key} · {feature.feature_group} · {feature.provider} · custo {feature.estimated_credit_cost} · {data.interestCounts[feature.key] ?? 0} interessados<br />Atualizado em {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(feature.updated_at))} · responsável {feature.updated_by || "seed do sistema"}</span></p></div>
        <AdminActionForm action={updateProductFeatureAction} className="admin-form admin-inline-form">
          <input type="hidden" name="key" value={feature.key} />
          <label>Estado<select name="status" defaultValue={feature.status}><option value="disabled">Desativado</option><option value="development">Desenvolvimento</option><option value="beta">Beta</option><option value="active">Ativo</option></select></label>
          <label>Acesso<select name="audience" defaultValue={feature.audience}><option value="public">Público</option><option value="free">Gratuito com conta</option><option value="premium">Premium</option><option value="admin">Admin</option></select></label>
          <label>Visibilidade<select name="visibility" defaultValue={feature.visibility}><option value="hidden">Oculto</option><option value="preview">Preview</option><option value="full">Completo</option></select></label>
          <label>Habilitado<select name="enabled" defaultValue={String(feature.enabled)}><option value="false">Não</option><option value="true">Sim</option></select></label>
          <label>Máximo de itens<input name="maxItems" type="number" min={1} max={100} defaultValue={feature.limits.maxItems ?? 5} /></label>
          <label>Chamadas/dia<input name="dailyRequests" type="number" min={0} max={10000} defaultValue={feature.limits.dailyRequests ?? 0} /></label>
          <label>Cache (minutos)<input name="cacheMinutes" type="number" min={0} max={10080} defaultValue={feature.limits.cacheMinutes ?? 0} /></label>
          <label>Custo estimado (créditos)<input name="estimatedCreditCost" type="number" min={0} max={10000} step="0.01" defaultValue={feature.estimated_credit_cost} /></label>
          <label>Dependências<input name="dependencies" defaultValue={feature.dependencies.join(", ")} placeholder="chaves separadas por vírgula" /></label>
          <label>Confirmação crítica<input name="confirmation" placeholder="ATIVAR quando solicitado" autoComplete="off" /></label>
        </AdminActionForm>
      </article>)}</div>
    </section>
    <section className="admin-panel">
      <h2>Categorias de descoberta</h2>
      <article className="admin-setting"><div><h3>Nova categoria</h3><p>O slug deve ser estável, minúsculo e sem espaços.</p></div><AdminActionForm action={saveContentCategoryAction} className="admin-form admin-inline-form">
        <input type="hidden" name="id" value="" /><label>Slug<input name="slug" pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={80} required /></label><label>Nome<input name="name" minLength={2} maxLength={80} required /></label><label>Descrição<input name="description" maxLength={500} /></label><label>Palavras-chave<input name="keywords" maxLength={500} /></label><label>Hashtags-semente<input name="seedHashtags" maxLength={500} /></label><label>Termos excluídos<input name="excludedTerms" maxLength={500} /></label><label>Idioma<input name="language" defaultValue="pt-BR" required /></label><label>País<input name="country" defaultValue="BR" required /></label><label>Atualização (min)<input name="refreshMinutes" type="number" min={60} max={10080} defaultValue={1440} /></label><label>Posição<input name="position" type="number" min={0} max={10000} defaultValue={100} /></label><input type="hidden" name="enabled" value="false" /><input type="hidden" name="visible" value="false" />
      </AdminActionForm></article>
      <div className="admin-settings-grid">{(data.categories as CategoryRow[]).map((category) => <article className="admin-setting" key={category.id}>
        <div><h3>{category.name}</h3><p><span className="admin-mono">/descobrir/{category.slug}</span></p></div>
        <AdminActionForm action={saveContentCategoryAction} className="admin-form admin-inline-form">
          <input type="hidden" name="id" value={category.id} /><label>Slug<input name="slug" defaultValue={category.slug} pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={80} required /></label><label>Nome<input name="name" defaultValue={category.name} minLength={2} maxLength={80} required /></label><label>Descrição<input name="description" defaultValue={category.description} maxLength={500} /></label><label>Palavras-chave<input name="keywords" defaultValue={category.keywords.join(", ")} maxLength={500} /></label><label>Hashtags-semente<input name="seedHashtags" defaultValue={category.seed_hashtags.join(", ")} maxLength={500} /></label><label>Termos excluídos<input name="excludedTerms" defaultValue={category.excluded_terms.join(", ")} maxLength={500} /></label><label>Idioma<input name="language" defaultValue={category.language} required /></label><label>País<input name="country" defaultValue={category.country} required /></label><label>Atualização (min)<input name="refreshMinutes" type="number" min={60} max={10080} defaultValue={category.refresh_minutes} /></label><label>Posição<input name="position" type="number" min={0} max={10000} defaultValue={category.position} /></label><label>Habilitada<select name="enabled" defaultValue={String(category.enabled)}><option value="false">Não</option><option value="true">Sim</option></select></label><label>Visível<select name="visible" defaultValue={String(category.visible)}><option value="false">Não</option><option value="true">Sim</option></select></label><label>Confirmação<input name="confirmation" placeholder="ATIVAR ao habilitar" autoComplete="off" /></label>
        </AdminActionForm>
        <AdminActionForm action={deleteContentCategoryAction} className="admin-form admin-inline-form"><input type="hidden" name="id" value={category.id} /><input type="hidden" name="slug" value={category.slug} /><label>Excluir categoria<input name="confirmation" placeholder={`EXCLUIR ${category.slug}`} autoComplete="off" /></label></AdminActionForm>
      </article>)}</div>
    </section>
  </>;
}
