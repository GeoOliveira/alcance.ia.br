import { requireAdminSession } from "@/lib/admin/auth";
import { listAdminTable } from "@/lib/admin/data";
import { updateSettingAction } from "@/app/admin/actions/operations";
import { AdminActionForm } from "@/components/admin/admin-action-form";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import type { AppSetting } from "@/types/admin";

function inputValue(setting: AppSetting) { return typeof setting.value === "string" ? setting.value : JSON.stringify(setting.value); }
export default async function SettingsPage() {
  await requireAdminSession("settings.manage"); const settings = await listAdminTable("app_settings") as AppSetting[];
  const grouped = settings.reduce<Record<string, AppSetting[]>>((result, setting) => {
    (result[setting.category] ||= []).push(setting);
    return result;
  }, {});
  return <><AdminPageHeader eyebrow="OPERAÇÃO" title="Configurações" description="Lista fechada de valores operacionais. Segredos e variáveis da Vercel não aparecem aqui." />
    {Object.entries(grouped).map(([category, rows]) => <section className="admin-panel" key={category}><h2>{category}</h2><div className="admin-settings-grid">{rows?.map((setting) => <article className="admin-setting" key={setting.id}><div><h3>{setting.label}</h3><p>{setting.description}<br /><span className="admin-mono">{setting.key}</span></p></div><AdminActionForm action={updateSettingAction} className="admin-form admin-inline-form"><input type="hidden" name="id" value={setting.id} /><input type="hidden" name="key" value={setting.key} />{setting.value_type === "boolean" ? <label>Valor<select name="value" defaultValue={String(setting.value)}><option value="true">Ativado</option><option value="false">Desativado</option></select></label> : <label>Valor<input name="value" type={setting.value_type === "number" ? "number" : setting.value_type === "email" ? "email" : setting.value_type === "url" ? "url" : "text"} defaultValue={inputValue(setting)} required={setting.value_type !== "string"} /></label>}{setting.key === "maintenance.enabled" && <label>Para ativar, digite MANUTENÇÃO<input name="confirmation" autoComplete="off" /></label>}</AdminActionForm></article>)}</div></section>)}
  </>;
}
