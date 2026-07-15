import { AdminActionForm } from "@/components/admin/admin-action-form";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { requireAdminSession } from "@/lib/admin/auth";
import { getProductResourcesAdminData } from "@/lib/admin/data";
import { deleteContentCategoryAction, saveContentCategoryAction } from "../recursos/actions";

type CategoryRow = { id: string; slug: string; name: string; description: string; keywords: string[]; seed_hashtags: string[]; excluded_terms: string[]; language: string; country: string; enabled: boolean; visible: boolean; refresh_minutes: number; position: number };

function CategoryForm({ category }: { category?: CategoryRow }) {
  return <AdminActionForm action={saveContentCategoryAction} className="admin-form admin-resource-form" submitLabel={category ? "Salvar categoria" : "Criar categoria"}>
    <input type="hidden" name="id" value={category?.id || ""} />
    <fieldset><legend>Identificação</legend><div><label>Nome<input name="name" defaultValue={category?.name} minLength={2} maxLength={80} required /></label><label>Slug<input name="slug" defaultValue={category?.slug} pattern="[a-z0-9]+(-[a-z0-9]+)*" maxLength={80} required /></label></div><label>Descrição<input name="description" defaultValue={category?.description} maxLength={500} /></label></fieldset>
    <fieldset><legend>Critérios de descoberta</legend><label>Palavras-chave<input name="keywords" defaultValue={category?.keywords.join(", ")} maxLength={500} placeholder="termo 1, termo 2" /></label><label>Hashtags-semente<input name="seedHashtags" defaultValue={category?.seed_hashtags.join(", ")} maxLength={500} placeholder="hashtag1, hashtag2" /></label><label>Termos excluídos<input name="excludedTerms" defaultValue={category?.excluded_terms.join(", ")} maxLength={500} /></label></fieldset>
    <fieldset><legend>Publicação e ordem</legend><div><label>Ordem<input name="position" type="number" min={0} max={10000} defaultValue={category?.position ?? 100} /></label><label>Ativa<select name="enabled" defaultValue={String(category?.enabled ?? false)}><option value="true">Sim</option><option value="false">Não</option></select></label><label>Visível publicamente<select name="visible" defaultValue={String(category?.visible ?? false)}><option value="true">Sim</option><option value="false">Não</option></select></label><label>Idioma<input name="language" defaultValue={category?.language || "pt-BR"} pattern="[a-z]{2}(-[A-Z]{2})?" required /></label><label>País<input name="country" defaultValue={category?.country || "BR"} pattern="[A-Z]{2}" required /></label><label>Atualização (min)<input name="refreshMinutes" type="number" min={60} max={10080} defaultValue={category?.refresh_minutes ?? 1440} /></label></div></fieldset>
    <label className="admin-critical-confirm">Confirmação para habilitar<input name="confirmation" placeholder="Digite ATIVAR ao habilitar" autoComplete="off" /><small>Obrigatória ao publicar uma categoria que estava inativa.</small></label>
  </AdminActionForm>;
}

export default async function CategoriesAdminPage() {
  await requireAdminSession("features.manage");
  const data = await getProductResourcesAdminData();
  const categories = data.categories as CategoryRow[];
  return <>
    <AdminPageHeader eyebrow="DESCOBERTA" title="Categorias" description="Edite taxonomia, sementes, ordem e disponibilidade pública dos Reels por categoria." />
    <div className="admin-stat-grid"><article className="admin-stat-card"><span>Categorias cadastradas</span><strong>{categories.length}</strong><small>Fonte única da descoberta</small></article><article className="admin-stat-card"><span>Ativas</span><strong>{categories.filter((item) => item.enabled).length}</strong><small>Disponíveis para snapshots</small></article><article className="admin-stat-card"><span>Públicas</span><strong>{categories.filter((item) => item.enabled && item.visible).length}</strong><small>Elegíveis para página e SEO</small></article></div>
    <section className="admin-panel admin-resource-panel"><div className="admin-panel-header"><div><h2>Taxonomia administrável</h2><p>A ordem abaixo controla a navegação pública. Apenas categorias ativas e visíveis entram no SEO.</p></div></div><div className="admin-resource-groups"><section><div>
      <details className="admin-resource-item admin-resource-create"><summary><span className="admin-resource-add">+</span><div className="admin-resource-title"><strong>Nova categoria</strong><small>Criar inativa por padrão</small></div><i aria-hidden="true">⌄</i></summary><div className="admin-resource-editor"><CategoryForm /></div></details>
      {categories.map((category) => <details className="admin-resource-item" key={category.id}><summary><span className={`admin-resource-state ${category.enabled ? "is-enabled" : ""}`} /><div className="admin-resource-title"><strong>{category.name}</strong><small>/recursos/reels-por-categoria/{category.slug}</small></div><div className="admin-resource-badges"><span>{category.language}</span><span>{category.country}</span><span data-tone={category.visible ? "active" : "disabled"}>{category.visible ? "Pública" : "Oculta"}</span></div><div className="admin-resource-metrics"><span><b>{category.position}</b> ordem</span></div><i aria-hidden="true">⌄</i></summary><div className="admin-resource-editor"><CategoryForm category={category} /><div className="admin-resource-danger"><strong>Excluir categoria</strong><p>Prefira desativar quando houver snapshots vinculados.</p><AdminActionForm action={deleteContentCategoryAction} className="admin-form admin-inline-form" submitLabel="Excluir categoria"><input type="hidden" name="id" value={category.id} /><input type="hidden" name="slug" value={category.slug} /><label>Confirmação<input name="confirmation" placeholder={`EXCLUIR ${category.slug}`} autoComplete="off" /></label></AdminActionForm></div></div></details>)}
    </div></section></div></section>
  </>;
}
