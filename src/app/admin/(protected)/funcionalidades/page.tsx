import { requireAdminSession } from "@/lib/admin/auth";
import { listAdminTable } from "@/lib/admin/data";
import { updateFeatureFlagAction } from "@/app/admin/actions/operations";
import { AdminActionForm } from "@/components/admin/admin-action-form";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import type { FeatureFlag } from "@/types/admin";

export default async function FeatureFlagsPage() {
  await requireAdminSession("features.manage"); const flags = await listAdminTable("feature_flags") as FeatureFlag[];
  return <><AdminPageHeader eyebrow="CONTROLE" title="Funcionalidades" description="Flags controlam somente recursos conhecidos. Ativar uma flag não cria uma funcionalidade inexistente." />
    <div className="admin-settings-grid">{flags.map((flag) => <article className="admin-setting" key={flag.id}><div><h3>{flag.name}</h3><p>{flag.description}<br /><span className="admin-mono">{flag.key} · {flag.scope}</span></p></div><AdminActionForm action={updateFeatureFlagAction} className="admin-form admin-inline-form"><input type="hidden" name="id" value={flag.id} /><label>Estado<select name="enabled" defaultValue={String(flag.enabled)}><option value="true">Ativada</option><option value="false">Desativada</option></select></label>{["maintenance_mode", "contact_form"].includes(flag.key) && <label>Digite CONFIRMAR<input name="confirmation" autoComplete="off" /></label>}</AdminActionForm></article>)}</div>
  </>;
}
