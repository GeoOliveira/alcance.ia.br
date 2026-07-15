"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { authorizeAdminAction } from "@/lib/admin/auth";
import { writeAudit } from "@/lib/admin/audit";
import { parseSettingInput } from "@/lib/settings/definitions";
import {
  adminProfileSchema, contentUpdateSchema, criticalActionSchema, faqSchema,
  featureFlagSchema, recordUpdateSchema, settingUpdateSchema,
} from "@/lib/admin/validation";
import type { ActionState, AdminRole } from "@/types/admin";

const analysisStatuses = ["pending", "processing", "preview_ready", "completed", "failed", "cancelled", "expired"];
const contactStatuses = ["new", "in_progress", "answered", "archived", "spam", "resolved"];

function invalid(message = "Revise os campos informados."): ActionState { return { ok: false, message }; }
function success(message: string): ActionState { return { ok: true, message }; }

export async function updateAnalysisAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let session;
  try { session = await authorizeAdminAction("analysis.manage"); } catch { return invalid("Sua sessão expirou ou você não possui permissão."); }
  const parsed = recordUpdateSchema.safeParse({ id: formData.get("id"), status: formData.get("status"), notes: formData.get("notes") || "" });
  if (!parsed.success || !analysisStatuses.includes(parsed.data.status)) return invalid();
  const supabase = await createClient();
  const { data: before } = await supabase.from("analysis_requests").select("status,admin_notes").eq("id", parsed.data.id).maybeSingle();
  if (!before) return invalid("Solicitação não encontrada.");
  const { error } = await supabase.from("analysis_requests").update({ status: parsed.data.status, admin_notes: parsed.data.notes || null }).eq("id", parsed.data.id);
  if (error) return invalid("Não foi possível atualizar a solicitação.");
  await writeAudit({ action: "analysis_request_updated", entityType: "analysis_request", entityId: parsed.data.id, before, after: { status: parsed.data.status, notes_changed: before.admin_notes !== parsed.data.notes }, metadata: { actor_role: session.profile.role } });
  revalidatePath(`/admin/solicitacoes/${parsed.data.id}`); revalidatePath("/admin/solicitacoes"); revalidatePath("/admin");
  return success("Solicitação atualizada e registrada na auditoria.");
}

export async function updateContactAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try { await authorizeAdminAction("contacts.manage"); } catch { return invalid("Sua sessão expirou ou você não possui permissão."); }
  const parsed = recordUpdateSchema.safeParse({ id: formData.get("id"), status: formData.get("status"), notes: formData.get("notes") || "" });
  if (!parsed.success || !contactStatuses.includes(parsed.data.status)) return invalid();
  const supabase = await createClient();
  const { data: before } = await supabase.from("contact_messages").select("status,admin_notes").eq("id", parsed.data.id).maybeSingle();
  if (!before) return invalid("Mensagem não encontrada.");
  const { error } = await supabase.from("contact_messages").update({ status: parsed.data.status, admin_notes: parsed.data.notes || null }).eq("id", parsed.data.id);
  if (error) return invalid("Não foi possível atualizar a mensagem.");
  await writeAudit({ action: "contact_message_updated", entityType: "contact_message", entityId: parsed.data.id, before, after: { status: parsed.data.status, notes_changed: before.admin_notes !== parsed.data.notes } });
  revalidatePath(`/admin/contatos/${parsed.data.id}`); revalidatePath("/admin/contatos"); revalidatePath("/admin");
  return success("Contato atualizado e registrado na auditoria.");
}

export async function criticalRecordAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = criticalActionSchema.safeParse({
    id: formData.get("id"), confirmation: formData.get("confirmation"), expected: formData.get("expected"), reason: formData.get("reason") || "",
  });
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);
  const operation = String(formData.get("operation") || "");
  const permission = operation === "delete_contact" ? "contacts.delete" as const : "analysis.delete" as const;
  try { await authorizeAdminAction(permission); } catch { return invalid("Esta ação exige permissão de superadministrador."); }
  const supabase = await createClient();
  const rpc = operation === "anonymize_analysis" ? "admin_anonymize_analysis_request"
    : operation === "delete_analysis" ? "admin_delete_analysis_request"
      : operation === "delete_contact" ? "admin_delete_contact_message" : null;
  if (!rpc) return invalid("Operação inválida.");
  const { data, error } = await supabase.rpc(rpc, { p_id: parsed.data.id, p_reason: parsed.data.reason });
  if (error || !data) return invalid("A operação não pôde ser concluída.");
  revalidatePath("/admin"); revalidatePath("/admin/solicitacoes"); revalidatePath("/admin/contatos");
  return success(operation.startsWith("delete") ? "Registro excluído com auditoria." : "Registro anonimizado com auditoria.");
}

export async function updateSettingAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let session;
  try { session = await authorizeAdminAction("settings.manage"); } catch { return invalid("Você não possui permissão para alterar configurações."); }
  const parsed = settingUpdateSchema.safeParse({ id: formData.get("id"), key: formData.get("key"), value: formData.get("value") });
  if (!parsed.success) return invalid();
  const supabase = await createClient();
  const { data: current } = await supabase.from("app_settings").select("key,value,value_type,is_editable").eq("id", parsed.data.id).eq("key", parsed.data.key).maybeSingle();
  if (!current?.is_editable) return invalid("Configuração não editável.");
  const value = parseSettingInput(current.key, current.value_type, parsed.data.value);
  if (!value.success) return invalid(value.error);
  if (current.key === "maintenance.enabled" && value.value === true && formData.get("confirmation") !== "MANUTENÇÃO") {
    return invalid("Digite MANUTENÇÃO para ativar o modo de manutenção.");
  }
  const { error } = await supabase.from("app_settings").update({ value: value.value, updated_by: session.userId }).eq("id", parsed.data.id).eq("key", parsed.data.key);
  if (error) return invalid("Não foi possível salvar a configuração.");
  await writeAudit({ action: current.key === "maintenance.enabled" ? "maintenance_setting_changed" : "setting_updated", entityType: "app_setting", entityId: current.key, before: { value: current.value }, after: { value: value.value } });
  revalidateTag("public-settings", "max"); revalidatePath("/"); revalidatePath("/admin/configuracoes");
  return success("Configuração salva. O cache público foi invalidado.");
}

export async function updateFeatureFlagAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let session;
  try { session = await authorizeAdminAction("features.manage"); } catch { return invalid("Esta ação exige permissão de superadministrador."); }
  const parsed = featureFlagSchema.safeParse({ id: formData.get("id"), enabled: formData.get("enabled") });
  if (!parsed.success) return invalid();
  const supabase = await createClient();
  const { data: current } = await supabase.from("feature_flags").select("key,enabled").eq("id", parsed.data.id).maybeSingle();
  if (!current) return invalid("Funcionalidade não encontrada.");
  const enabled = parsed.data.enabled === "true";
  if (["maintenance_mode", "contact_form"].includes(current.key) && formData.get("confirmation") !== "CONFIRMAR") return invalid("Digite CONFIRMAR para alterar esta funcionalidade.");
  const { error } = await supabase.from("feature_flags").update({ enabled, updated_by: session.userId }).eq("id", parsed.data.id);
  if (error) return invalid("Não foi possível alterar a funcionalidade.");
  await writeAudit({ action: "feature_flag_updated", entityType: "feature_flag", entityId: current.key, before: { enabled: current.enabled }, after: { enabled } });
  revalidateTag("public-flags", "max"); revalidatePath("/"); revalidatePath("/admin/funcionalidades"); revalidatePath("/admin/recursos"); revalidatePath("/analisar/[requestId]", "page");
  if (current.key === "resource_hashtags") { revalidateTag("resource-hashtags-config", "max"); revalidateTag("resource-hashtags-data", "max"); revalidatePath("/recursos/hashtags"); }
  if (current.key === "resource_trending_reels") { revalidateTag("resource-trending-reels-config", "max"); revalidateTag("resource-trending-reels-data", "max"); revalidatePath("/recursos/reels-em-alta"); }
  if (current.key === "resource_reels_by_category") { revalidateTag("resource-category-reels-config", "max"); revalidateTag("resource-category-reels-data", "max"); revalidatePath("/recursos/reels-por-categoria", "layout"); }
  if (current.key.startsWith("resource_branded_content")) { revalidatePath("/recursos/conteudo-de-marca"); revalidatePath("/admin/recursos/branded_content_search"); }
  return success("Funcionalidade atualizada.");
}

export async function updateContentAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let session;
  try { session = await authorizeAdminAction("content.manage"); } catch { return invalid("Você não possui permissão para editar conteúdo."); }
  const parsed = contentUpdateSchema.safeParse({ id: formData.get("id"), value: formData.get("value") });
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);
  const supabase = await createClient();
  const { data: current } = await supabase.from("site_content").select("section,content_key,content_value").eq("id", parsed.data.id).maybeSingle();
  if (!current) return invalid("Conteúdo não encontrado.");
  const { error } = await supabase.from("site_content").update({ content_value: parsed.data.value, updated_by: session.userId }).eq("id", parsed.data.id);
  if (error) return invalid("Não foi possível salvar o conteúdo.");
  await writeAudit({ action: "site_content_updated", entityType: "site_content", entityId: `${current.section}.${current.content_key}`, before: { value: current.content_value }, after: { value: parsed.data.value } });
  revalidateTag("home-content", "max"); revalidatePath("/"); revalidatePath("/admin/conteudo/home");
  return success("Conteúdo salvo e página inicial revalidada.");
}

export async function saveFaqAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let session;
  try { session = await authorizeAdminAction("faq.manage"); } catch { return invalid("Você não possui permissão para editar o FAQ."); }
  const parsed = faqSchema.safeParse({ id: formData.get("id") || undefined, question: formData.get("question"), answer: formData.get("answer"), position: formData.get("position"), isActive: formData.get("isActive") });
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);
  const supabase = await createClient();
  const values = { question: parsed.data.question, answer: parsed.data.answer, position: parsed.data.position, is_active: parsed.data.isActive === "true", updated_by: session.userId };
  let entityId = parsed.data.id;
  let before: Record<string, unknown> | null = null;
  if (entityId) {
    const { data } = await supabase.from("site_faqs").select("question,answer,position,is_active").eq("id", entityId).maybeSingle(); before = data;
    const { error } = await supabase.from("site_faqs").update(values).eq("id", entityId); if (error) return invalid("Não foi possível salvar a pergunta.");
  } else {
    const { data, error } = await supabase.from("site_faqs").insert(values).select("id").single(); if (error || !data) return invalid("Não foi possível criar a pergunta."); entityId = data.id;
  }
  await writeAudit({ action: before ? "faq_updated" : "faq_created", entityType: "site_faq", entityId, before, after: { position: values.position, is_active: values.is_active, content_changed: true } });
  revalidateTag("public-faqs", "max"); revalidatePath("/"); revalidatePath("/admin/conteudo/faq");
  return success("FAQ salvo e cache público invalidado.");
}

export async function deleteFaqAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try { await authorizeAdminAction("faq.delete"); } catch { return invalid("Você não possui permissão para excluir perguntas."); }
  const parsed = criticalActionSchema.safeParse({ id: formData.get("id"), confirmation: formData.get("confirmation"), expected: "EXCLUIR", reason: "" });
  if (!parsed.success) return invalid("Digite EXCLUIR para confirmar.");
  const supabase = await createClient();
  const { data: current } = await supabase.from("site_faqs").select("position,is_active").eq("id", parsed.data.id).maybeSingle();
  const { error } = await supabase.from("site_faqs").delete().eq("id", parsed.data.id);
  if (error) return invalid("Não foi possível excluir a pergunta.");
  await writeAudit({ action: "faq_deleted", entityType: "site_faq", entityId: parsed.data.id, before: current, after: null });
  revalidateTag("public-faqs", "max"); revalidatePath("/"); revalidatePath("/admin/conteudo/faq");
  return success("Pergunta excluída.");
}

export async function createAdminProfileAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let session;
  try { session = await authorizeAdminAction("users.manage"); } catch { return invalid("Esta ação exige permissão de superadministrador."); }
  const parsed = adminProfileSchema.safeParse({ userId: formData.get("userId"), displayName: formData.get("displayName"), role: formData.get("role") });
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);
  const supabase = await createClient();
  const { data, error } = await supabase.from("admin_profiles").insert({ user_id: parsed.data.userId, display_name: parsed.data.displayName, role: parsed.data.role, created_by: session.userId }).select("id").single();
  if (error || !data) return invalid("Não foi possível associar o usuário. Confirme o UUID e se ele já possui perfil.");
  await writeAudit({ action: "admin_profile_created", entityType: "admin_profile", entityId: data.id, after: { role: parsed.data.role, active: true } });
  revalidatePath("/admin/usuarios"); return success("Administrador associado ao usuário existente.");
}

export async function updateAdminProfileAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let session;
  try { session = await authorizeAdminAction("users.manage"); } catch { return invalid("Esta ação exige permissão de superadministrador."); }
  const id = String(formData.get("id") || ""); const role = String(formData.get("role") || "") as AdminRole; const isActive = formData.get("isActive") === "true";
  if (!/^[0-9a-f-]{36}$/i.test(id) || !["admin", "editor", "support", "analyst"].includes(role)) return invalid();
  if (formData.get("confirmation") !== "CONFIRMAR") return invalid("Digite CONFIRMAR para alterar o acesso.");
  const supabase = await createClient();
  const { data: current } = await supabase.from("admin_profiles").select("role,is_active,user_id").eq("id", id).maybeSingle();
  if (!current) return invalid("Perfil não encontrado.");
  const { error } = await supabase.from("admin_profiles").update({ role, is_active: isActive }).eq("id", id);
  if (error) return invalid("A alteração foi bloqueada. O último superadministrador não pode ser removido.");
  await writeAudit({ action: isActive ? "admin_profile_updated" : "admin_profile_deactivated", entityType: "admin_profile", entityId: id, before: { role: current.role, active: current.is_active }, after: { role, active: isActive }, metadata: { self_change: current.user_id === session.userId } });
  revalidatePath("/admin/usuarios"); return success("Acesso administrativo atualizado.");
}
