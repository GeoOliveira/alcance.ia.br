import { requireAdminSession } from "@/lib/admin/auth";
import { listAdminTable } from "@/lib/admin/data";
import { updateFeatureFlagAction } from "@/app/admin/actions/operations";
import { AdminActionForm } from "@/components/admin/admin-action-form";
import { AdminEmptyState, AdminPageHeader } from "@/components/admin/admin-ui";
import type { FeatureFlag } from "@/types/admin";

type Params = { busca?: string; categoria?: string; status?: string; escopo?: string };
const categories = ["Análise", "Inteligência artificial", "Conteúdo", "Integrações", "Recursos públicos", "Premium", "Administração", "Experimentos"] as const;
function categoryFor(key: string) {
  if (/openai|ai_|insight/.test(key)) return "Inteligência artificial";
  if (/resource|reels|hashtag|public/.test(key)) return "Recursos públicos";
  if (/provider|apify|meta|scrape|turnstile/.test(key)) return "Integrações";
  if (/content|faq|home/.test(key)) return "Conteúdo";
  if (/premium|payment|plan/.test(key)) return "Premium";
  if (/admin|audit|maintenance/.test(key)) return "Administração";
  if (/beta|experiment|preview/.test(key)) return "Experimentos";
  return "Análise";
}

export default async function FeatureFlagsPage({ searchParams }: { searchParams: Promise<Params> }) {
  await requireAdminSession("features.manage");
  const [flags, params] = [await listAdminTable("feature_flags") as FeatureFlag[], await searchParams];
  const query = (params.busca || "").toLocaleLowerCase("pt-BR").slice(0, 80);
  const filtered = flags.filter((flag) => (!query || `${flag.name} ${flag.description} ${flag.key}`.toLocaleLowerCase("pt-BR").includes(query)) && (!params.categoria || categoryFor(flag.key) === params.categoria) && (!params.status || String(flag.enabled) === params.status) && (!params.escopo || flag.scope === params.escopo));
  return <><AdminPageHeader eyebrow="CONTROLE E IMPACTO" title="Funcionalidades" description="Entenda estado, escopo e impacto antes de alterar uma flag conhecida pela aplicação." />
    <form className="admin-filter-form admin-feature-filters"><label>Busca<input name="busca" defaultValue={params.busca} placeholder="Nome, descrição ou chave" /></label><label>Categoria<select name="categoria" defaultValue={params.categoria}><option value="">Todas</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label>Status<select name="status" defaultValue={params.status}><option value="">Todos</option><option value="true">Ativadas</option><option value="false">Desativadas</option></select></label><label>Escopo<select name="escopo" defaultValue={params.escopo}><option value="">Todos</option><option value="public">Público</option><option value="admin">Admin</option><option value="internal">Interno</option></select></label><button className="admin-secondary-button">Filtrar</button></form>
    <div className="admin-feature-summary"><span><strong>{flags.length}</strong> cadastradas</span><span><strong>{flags.filter((flag) => flag.enabled).length}</strong> ativas</span><span><strong>{filtered.length}</strong> exibidas</span></div>
    <div className="admin-feature-groups">{categories.map((category) => { const rows = filtered.filter((flag) => categoryFor(flag.key) === category); if (!rows.length) return null; return <section key={category}><header><h2>{category}</h2><span>{rows.length}</span></header><div>{rows.map((flag) => <article className="admin-feature-card" key={flag.id}><div className="admin-feature-card-head"><span className={`admin-feature-indicator ${flag.enabled ? "is-on" : ""}`} /><div><h3>{flag.name}</h3><code>{flag.key}</code></div><span className="admin-status">{flag.enabled ? "Ativa" : "Inativa"}</span></div><p>{flag.description || "Sem descrição operacional cadastrada."}</p><dl><div><dt>Escopo</dt><dd>{flag.scope}</dd></div><div><dt>Impacto</dt><dd>{flag.scope === "public" ? "Pode alterar a experiência pública" : "Restrito ao ambiente administrativo"}</dd></div><div><dt>Dependências</dt><dd>{Array.isArray(flag.configuration?.dependencies) ? flag.configuration.dependencies.join(", ") : "Nenhuma registrada"}</dd></div><div><dt>Última alteração</dt><dd>{flag.updated_at ? new Date(flag.updated_at).toLocaleString("pt-BR") : "Não registrada"}</dd></div></dl><AdminActionForm action={updateFeatureFlagAction} className="admin-form admin-feature-action" submitLabel="Aplicar alteração"><input type="hidden" name="id" value={flag.id} /><label>Estado<select name="enabled" defaultValue={String(flag.enabled)}><option value="true">Ativada</option><option value="false">Desativada</option></select></label>{["maintenance_mode", "contact_form"].includes(flag.key) && <label className="admin-critical-confirm">Confirmação<input name="confirmation" placeholder="CONFIRMAR" autoComplete="off" /><small>Esta flag afeta uma função pública crítica.</small></label>}</AdminActionForm></article>)}</div></section>; })}</div>
    {!filtered.length && <AdminEmptyState title="Nenhuma funcionalidade encontrada" message="Revise os filtros ou limpe a busca." />}
  </>;
}
