import { requireAdminSession } from "@/lib/admin/auth";
import { listAdminTable } from "@/lib/admin/data";
import { updateSettingAction } from "@/app/admin/actions/operations";
import { AdminActionForm } from "@/components/admin/admin-action-form";
import { AdminEmptyState, AdminPageHeader } from "@/components/admin/admin-ui";
import type { AppSetting } from "@/types/admin";

const categoryLabels: Record<string, string> = { general: "Geral", analysis: "Análise", signup: "Cadastro", content: "Conteúdo", seo: "SEO", privacy: "Privacidade", integrations: "Integrações", analytics: "Analytics", limits: "Limites", maintenance: "Manutenção", ai: "Inteligência artificial", product: "Produto", discovery: "Descoberta" };
function inputValue(setting: AppSetting) { return typeof setting.value === "string" ? setting.value : JSON.stringify(setting.value); }

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ busca?: string; categoria?: string }> }) {
  await requireAdminSession("settings.manage");
  const [settings, params] = [await listAdminTable("app_settings") as AppSetting[], await searchParams];
  const query = (params.busca || "").toLocaleLowerCase("pt-BR").slice(0, 80);
  const filtered = settings.filter((setting) => (!params.categoria || setting.category === params.categoria) && (!query || `${setting.label} ${setting.description} ${setting.key}`.toLocaleLowerCase("pt-BR").includes(query)));
  const grouped = filtered.reduce<Record<string, AppSetting[]>>((result, setting) => { (result[setting.category] ||= []).push(setting); return result; }, {});
  const allCategories = [...new Set(settings.map((setting) => setting.category))];
  return <><AdminPageHeader eyebrow="CONFIGURAÇÃO SEGURA" title="Configurações" description="Valores operacionais com contexto, fallback e salvamento individual. Segredos continuam fora do painel." />
    <form className="admin-settings-search"><label><span>Buscar configuração</span><input name="busca" defaultValue={params.busca} placeholder="Nome, descrição ou chave técnica" /></label><label><span>Categoria</span><select name="categoria" defaultValue={params.categoria}><option value="">Todas as categorias</option>{allCategories.map((category) => <option key={category} value={category}>{categoryLabels[category] || category}</option>)}</select></label><button className="admin-secondary-button">Filtrar</button></form>
    <nav className="admin-settings-nav" aria-label="Categorias de configuração">{allCategories.map((category) => <a key={category} href={`#config-${category}`}>{categoryLabels[category] || category}<span>{settings.filter((setting) => setting.category === category).length}</span></a>)}</nav>
    <div className="admin-settings-sections">{Object.entries(grouped).map(([category, rows]) => <section className="admin-panel" id={`config-${category}`} key={category}><div className="admin-settings-section-head"><div><span>{category.toUpperCase()}</span><h2>{categoryLabels[category] || category}</h2></div><small>{rows.length} {rows.length === 1 ? "campo" : "campos"}</small></div><div className="admin-settings-grid">{rows.map((setting) => <article className="admin-setting" key={setting.id}><div><h3>{setting.label}</h3><p>{setting.description}</p><code>{setting.key}</code><dl><div><dt>Tipo</dt><dd>{setting.value_type}</dd></div><div><dt>Fallback</dt><dd>{String(setting.validation_schema?.default ?? "Definido no código")}</dd></div><div><dt>Última alteração</dt><dd>{setting.updated_at ? new Date(setting.updated_at).toLocaleString("pt-BR") : "Não registrada"}</dd></div></dl></div><AdminActionForm action={updateSettingAction} className="admin-form admin-inline-form"><input type="hidden" name="id" value={setting.id} /><input type="hidden" name="key" value={setting.key} />{setting.value_type === "boolean" ? <label>Valor atual<select name="value" defaultValue={String(setting.value)}><option value="true">Ativado</option><option value="false">Desativado</option></select></label> : <label>Valor atual<input name="value" type={setting.value_type === "number" ? "number" : setting.value_type === "email" ? "email" : setting.value_type === "url" ? "url" : "text"} defaultValue={inputValue(setting)} required={setting.value_type !== "string"} /></label>}{setting.key === "maintenance.enabled" && <label className="admin-critical-confirm">Para ativar, digite MANUTENÇÃO<input name="confirmation" autoComplete="off" /></label>}</AdminActionForm></article>)}</div></section>)}</div>
    {!filtered.length && <AdminEmptyState title="Nenhuma configuração encontrada" message="Revise a busca ou selecione outra categoria." />}
  </>;
}
