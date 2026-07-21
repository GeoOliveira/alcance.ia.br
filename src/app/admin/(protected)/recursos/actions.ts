"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { z } from "zod";
import { authorizeAdminAction } from "@/lib/admin/auth";
import { writeAudit } from "@/lib/admin/audit";
import { createClient } from "@/lib/supabase/server";
import { collectHashtagDiscovery } from "@/lib/product-features/hashtag-discovery";
import { dashboardModuleKeys } from "@/lib/analysis/dashboard/catalog";
import type { ActionState } from "@/types/admin";

const featureSchema = z.object({
  key: z.string().trim().min(1).max(100).regex(/^[a-z0-9_]+$/),
  audience: z.enum(["public", "free", "premium", "admin"]),
  status: z.enum(["development", "beta", "active", "disabled", "maintenance"]),
  visibility: z.enum(["hidden", "preview", "full"]),
  enabled: z.enum(["true", "false"]),
  maxItems: z.coerce.number().int().min(1).max(500),
  dailyRequests: z.coerce.number().int().min(0).max(10000),
  cacheMinutes: z.coerce.number().int().min(0).max(10080),
  estimatedCreditCost: z.coerce.number().min(0).max(10000),
  dependencies: z.string().max(1000),
  automaticRefresh: z.enum(["true", "false"]).optional(),
  indexable: z.enum(["true", "false"]).optional(),
  enabledCountries: z.string().max(500).optional(),
  enabledLanguages: z.string().max(500).optional(),
  anonymousDailyRequests: z.coerce.number().int().min(0).max(10000).optional(),
  freeDailyRequests: z.coerce.number().int().min(0).max(10000).optional(),
  premiumDailyRequests: z.coerce.number().int().min(0).max(10000).optional(),
  adminDailyRequests: z.coerce.number().int().min(0).max(10000).optional(),
  requiresAuthentication: z.enum(["true", "false"]).optional(),
  requiresPremium: z.enum(["true", "false"]).optional(),
  paginationEnabled: z.enum(["true", "false"]).optional(),
  aiSummaryEnabled: z.enum(["true", "false"]).optional(),
  exportEnabled: z.enum(["true", "false"]).optional(),
  historyEnabled: z.enum(["true", "false"]).optional(),
  beta: z.enum(["true", "false"]).optional(),
  unavailableMessage: z.string().trim().max(300).optional(),
  messageEnabled: z.enum(["true", "false"]).optional(),
  copyEnabled: z.enum(["true", "false"]).optional(),
  openLinkEnabled: z.enum(["true", "false"]).optional(),
  shareEnabled: z.enum(["true", "false"]).optional(),
  shortenerEnabled: z.enum(["true", "false"]).optional(),
  messageMaxCharacters: z.coerce.number().int().min(1).max(2000).optional(),
});
const categorySchema = z.object({ id: z.string().uuid().or(z.literal("")), slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80), name: z.string().trim().min(2).max(80), description: z.string().trim().max(500), keywords: z.string().max(500), seedHashtags: z.string().max(500), excludedTerms: z.string().max(500), language: z.string().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/), country: z.string().regex(/^[A-Z]{2}$/), refreshMinutes: z.coerce.number().int().min(60).max(10080), position: z.coerce.number().int().min(0).max(10000), enabled: z.enum(["true", "false"]), visible: z.enum(["true", "false"]) });
const dashboardModuleSchema = z.object({ key: z.enum([...dashboardModuleKeys, "branded_content_chart_types", "branded_content_chart_timeline", "branded_content_chart_partners", "branded_content_chart_creators"]), title: z.string().trim().min(3).max(120), description: z.string().trim().max(500), icon: z.string().trim().min(2).max(40), displayOrder: z.coerce.number().int().min(0).max(10000), minimumData: z.coerce.number().int().min(1).max(100), accessLevel: z.enum(["public", "free", "premium", "admin"]), status: z.enum(["development", "beta", "active", "disabled"]), enabled: z.enum(["true", "false"]), visible: z.enum(["true", "false"]), requiresAI: z.enum(["true", "false"]), requiresAuthentication: z.enum(["true", "false"]), requiresPremium: z.enum(["true", "false"]), dependencies: z.string().max(1000) });
const hashtagCollectionSchema = z.object({ categoryLimit: z.coerce.number().int().min(1).max(10), seedsPerCategory: z.coerce.number().int().min(1).max(3), period: z.enum(["last-week", "last-month", "last-year"]), confirmation: z.literal("COLETAR HASHTAGS") });
const fail = (message: string): ActionState => ({ ok: false, message });
const safeDependencyKey = /^[a-z0-9_]+$/;
const featureFlagByProductFeature: Record<string, string> = {
  whatsapp_link_manager: "resource_whatsapp_link_manager",
  whatsapp_manager_google_login: "whatsapp_manager_google_login",
  whatsapp_manager_google_one_tap: "whatsapp_manager_google_one_tap",
  whatsapp_manager_create_link: "whatsapp_manager_create_link",
  whatsapp_manager_shortener: "encurta_integration",
  whatsapp_manager_qr_code: "whatsapp_manager_qr_code",
  whatsapp_manager_click_metrics: "whatsapp_manager_click_metrics",
  whatsapp_manager_edit_link: "whatsapp_manager_edit_link",
  whatsapp_manager_expiration: "whatsapp_manager_expiration",
  whatsapp_manager_export: "whatsapp_manager_export",
  whatsapp_manager_custom_slug: "whatsapp_manager_custom_slug",
  whatsapp_manager_advanced_analytics: "whatsapp_manager_advanced_analytics",
};

export async function runHashtagDiscoveryAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let session;
  try { session = await authorizeAdminAction("features.manage"); } catch { return fail("Esta ação exige permissão de superadministrador."); }
  const parsed = hashtagCollectionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Revise os limites e digite COLETAR HASHTAGS para confirmar.");
  try {
    const summary = await collectHashtagDiscovery({ createdBy: session.userId, categoryLimit: parsed.data.categoryLimit, seedsPerCategory: parsed.data.seedsPerCategory, period: parsed.data.period });
    await writeAudit({ action: "hashtag_discovery_run", entityType: "product_feature", entityId: "category_hashtag_discovery", after: { selectedCategories: summary.selectedCategories, completedCategories: summary.completedCategories, partialCategories: summary.partialCategories, failedCategories: summary.failedCategories, providerCalls: summary.providerCalls, hashtagsPublished: summary.hashtagsPublished, period: parsed.data.period } });
    revalidateTag("resource-hashtags-data", "max");
    revalidatePath("/recursos/hashtags");
    revalidatePath("/admin/recursos");
    if (!summary.selectedCategories) return fail(`Nenhuma categoria foi coletada. O limite diário é ${summary.dailyLimit} e restam ${summary.remainingCalls} chamadas.`);
    return { ok: summary.failedCategories === 0, message: `${summary.hashtagsPublished} hashtags publicadas em ${summary.completedCategories + summary.partialCategories} categoria(s), usando ${summary.providerCalls} chamada(s). Restam ${summary.remainingCalls} hoje.${summary.failedCategories ? ` ${summary.failedCategories} categoria(s) falharam.` : ""}` };
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Não foi possível concluir a coleta de hashtags.");
  }
}

export async function updateDashboardModuleAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let session;
  try { session = await authorizeAdminAction("features.manage"); } catch { return fail("Esta ação exige permissão de superadministrador."); }
  const parsed = dashboardModuleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Revise os dados e os requisitos do módulo.");
  const supabase = await createClient();
  const { data: current } = await supabase.from("dashboard_modules").select("key,title,description,icon,enabled,visible,access_level,status,display_order,requires_ai,requires_authentication,requires_premium,configuration").eq("key", parsed.data.key).maybeSingle();
  if (!current) return fail("Módulo do dashboard não encontrado.");
  const dependencies = [...new Set(parsed.data.dependencies.split(",").map((item) => item.trim()).filter(Boolean))].slice(0, 20);
  const enabled = parsed.data.enabled === "true";
  const visible = parsed.data.visible === "true";
  const requiresAI = parsed.data.requiresAI === "true";
  const requiresAuthentication = parsed.data.requiresAuthentication === "true";
  const requiresPremium = parsed.data.requiresPremium === "true";
  const currentConfiguration = current.configuration && typeof current.configuration === "object" ? current.configuration as Record<string, unknown> : {};
  const critical = (enabled && !current.enabled) || (visible && !current.visible) || (parsed.data.status === "beta" && current.status !== "beta") || (parsed.data.accessLevel === "premium" && current.access_level !== "premium") || (requiresAI && !current.requires_ai) || (requiresPremium && !current.requires_premium) || parsed.data.minimumData > Number(currentConfiguration.minimumData ?? 1) || dependencies.join("|") !== (Array.isArray(currentConfiguration.dependencies) ? currentConfiguration.dependencies.join("|") : "");
  if (critical && formData.get("confirmation") !== "ATIVAR") return fail("Digite ATIVAR para confirmar esta mudança de disponibilidade ou requisito.");
  const next = { title: parsed.data.title, description: parsed.data.description, icon: parsed.data.icon, display_order: parsed.data.displayOrder, access_level: parsed.data.accessLevel, status: parsed.data.status, enabled, visible, requires_ai: requiresAI, requires_authentication: requiresAuthentication, requires_premium: requiresPremium, configuration: { ...currentConfiguration, minimumData: parsed.data.minimumData, dependencies }, updated_by: session.userId };
  const { error } = await supabase.from("dashboard_modules").update(next).eq("key", current.key);
  if (error) return fail("Não foi possível atualizar o módulo do dashboard.");
  await writeAudit({ action: "dashboard_module_updated", entityType: "dashboard_module", entityId: current.key, before: current, after: next });
  revalidatePath("/admin/recursos"); revalidatePath("/analisar/[requestId]", "page");
  return { ok: true, message: "Módulo atualizado e registrado na auditoria." };
}

export async function updateProductFeatureAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let session;
  try { session = await authorizeAdminAction("features.manage"); } catch { return fail("Esta ação exige permissão de superadministrador."); }
  const parsed = featureSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail(`Não foi possível validar este recurso: ${parsed.error.issues[0]?.message || "revise os campos informados"}.`);
  const supabase = await createClient();
  const { data: current } = await supabase.from("product_features").select("key,audience,status,visibility,enabled,requires_provider_call,estimated_credit_cost,dependencies,limits,metadata").eq("key", parsed.data.key).maybeSingle();
  if (!current) return fail("Recurso não encontrado no catálogo persistido.");
  const enabled = parsed.data.enabled === "true";
  const dependencies = [...new Set(parsed.data.dependencies.split(",").map((item) => item.trim()).filter((item) => safeDependencyKey.test(item)))].slice(0, 20);
  const currentLimits = current.limits as Record<string, number>;
  const currentMetadata = current.metadata && typeof current.metadata === "object" ? current.metadata as Record<string, unknown> : {};
  const automaticRefresh = parsed.data.automaticRefresh === undefined ? currentMetadata.automaticRefresh === true : parsed.data.automaticRefresh === "true";
  const indexable = parsed.data.indexable === undefined ? currentMetadata.indexable !== false : parsed.data.indexable === "true";
  const enabledCountries = parsed.data.enabledCountries === undefined ? currentMetadata.enabledCountries : [...new Set(parsed.data.enabledCountries.split(",").map((item) => item.trim().toUpperCase()).filter((item) => /^[A-Z]{2}$/.test(item)))].slice(0, 30);
  const enabledLanguages = parsed.data.enabledLanguages === undefined ? currentMetadata.enabledLanguages : [...new Set(parsed.data.enabledLanguages.split(",").map((item) => item.trim()).filter((item) => /^[a-z]{2}(?:-[A-Z]{2})?$/.test(item)))].slice(0, 30);
  const critical = (!enabled && current.enabled && current.visibility === "full") || (parsed.data.audience === "premium" && current.audience !== "premium") || parsed.data.dailyRequests > (currentLimits.dailyRequests ?? 0) || parsed.data.estimatedCreditCost > Number(current.estimated_credit_cost || 0) || dependencies.join("|") !== (current.dependencies || []).join("|") || (automaticRefresh && currentMetadata.automaticRefresh !== true) || (indexable && currentMetadata.indexable === false);
  if (critical && formData.get("confirmation") !== "ATIVAR") return fail("Digite ATIVAR para confirmar um recurso com consumo externo ou acesso premium completo.");
  const limits = { ...currentLimits, maxItems: parsed.data.maxItems, dailyRequests: parsed.data.dailyRequests, cacheMinutes: parsed.data.cacheMinutes, ...(parsed.data.anonymousDailyRequests === undefined ? {} : { anonymousDailyRequests: parsed.data.anonymousDailyRequests }), ...(parsed.data.freeDailyRequests === undefined ? {} : { freeDailyRequests: parsed.data.freeDailyRequests }), ...(parsed.data.premiumDailyRequests === undefined ? {} : { premiumDailyRequests: parsed.data.premiumDailyRequests }), ...(parsed.data.adminDailyRequests === undefined ? {} : { adminDailyRequests: parsed.data.adminDailyRequests }) };
  const optionalBoolean = (value: "true" | "false" | undefined, current: unknown) => value === undefined ? current === true : value === "true";
  const metadata = { ...currentMetadata, automaticRefresh, indexable, requiresAuthentication: optionalBoolean(parsed.data.requiresAuthentication, currentMetadata.requiresAuthentication), requiresPremium: optionalBoolean(parsed.data.requiresPremium, currentMetadata.requiresPremium), paginationEnabled: optionalBoolean(parsed.data.paginationEnabled, currentMetadata.paginationEnabled), aiSummaryEnabled: optionalBoolean(parsed.data.aiSummaryEnabled, currentMetadata.aiSummaryEnabled), exportEnabled: optionalBoolean(parsed.data.exportEnabled, currentMetadata.exportEnabled), historyEnabled: optionalBoolean(parsed.data.historyEnabled, currentMetadata.historyEnabled), beta: optionalBoolean(parsed.data.beta, currentMetadata.beta), messageEnabled: optionalBoolean(parsed.data.messageEnabled, currentMetadata.messageEnabled), copyEnabled: optionalBoolean(parsed.data.copyEnabled, currentMetadata.copyEnabled), openLinkEnabled: optionalBoolean(parsed.data.openLinkEnabled, currentMetadata.openLinkEnabled), shareEnabled: optionalBoolean(parsed.data.shareEnabled, currentMetadata.shareEnabled), shortenerEnabled: optionalBoolean(parsed.data.shortenerEnabled, currentMetadata.shortenerEnabled), ...(parsed.data.messageMaxCharacters === undefined ? {} : { messageMaxCharacters: parsed.data.messageMaxCharacters }), ...(parsed.data.unavailableMessage === undefined ? {} : { unavailableMessage: parsed.data.unavailableMessage }), ...(parsed.data.enabledCountries === undefined ? {} : { enabledCountries }), ...(parsed.data.enabledLanguages === undefined ? {} : { enabledLanguages }) };
  const next = { audience: parsed.data.audience, status: parsed.data.status, visibility: parsed.data.visibility, enabled, estimated_credit_cost: parsed.data.estimatedCreditCost, dependencies, limits, metadata, updated_by: session.userId };
  const { error } = await supabase.from("product_features").update(next).eq("key", current.key);
  if (error) return fail("Não foi possível atualizar o recurso.");
  const linkedFlag = featureFlagByProductFeature[current.key];
  if (linkedFlag) {
    const { data: flag, error: flagReadError } = await supabase.from("feature_flags").select("id,enabled").eq("key", linkedFlag).maybeSingle();
    if (flagReadError || !flag) {
      await supabase.from("product_features").update({ audience: current.audience, status: current.status, visibility: current.visibility, enabled: current.enabled, estimated_credit_cost: current.estimated_credit_cost, dependencies: current.dependencies, limits: current.limits, metadata: current.metadata, updated_by: session.userId }).eq("key", current.key);
      return fail("O recurso não foi alterado porque a flag operacional correspondente não foi encontrada.");
    }
    const { error: flagUpdateError } = await supabase.from("feature_flags").update({ enabled, updated_by: session.userId }).eq("id", flag.id);
    if (flagUpdateError) {
      await supabase.from("product_features").update({ audience: current.audience, status: current.status, visibility: current.visibility, enabled: current.enabled, estimated_credit_cost: current.estimated_credit_cost, dependencies: current.dependencies, limits: current.limits, metadata: current.metadata, updated_by: session.userId }).eq("key", current.key);
      return fail("O recurso não foi alterado porque a flag operacional não pôde ser sincronizada.");
    }
  }
  await writeAudit({ action: "product_feature_updated", entityType: "product_feature", entityId: current.key, before: { audience: current.audience, status: current.status, visibility: current.visibility, enabled: current.enabled, estimated_credit_cost: current.estimated_credit_cost, dependencies: current.dependencies, limits: current.limits }, after: next });
  revalidateTag("public-flags", "max"); revalidatePath("/admin/recursos"); revalidatePath("/admin/recursos/branded_content_search"); revalidatePath("/admin/recursos/whatsapp_link_manager"); revalidatePath("/admin/integracoes/google"); revalidatePath("/recursos"); revalidatePath("/recursos/conteudo-de-marca"); revalidatePath("/recursos/hashtags"); revalidatePath("/recursos/reels-em-alta"); revalidatePath("/recursos/reels-por-categoria", "layout"); revalidatePath("/recursos/gerador-link-whatsapp"); revalidatePath("/recursos/gerenciador-links-whatsapp"); revalidatePath("/entrar"); revalidatePath("/criar-conta"); revalidatePath("/painel", "layout"); revalidatePath("/analisar/[requestId]", "page");
  if (current.key === "resource_hashtags") { revalidateTag("resource-hashtags-config", "max"); revalidateTag("resource-hashtags-data", "max"); }
  if (current.key === "resource_trending_reels") { revalidateTag("resource-trending-reels-config", "max"); revalidateTag("resource-trending-reels-data", "max"); }
  if (current.key === "resource_reels_by_category") { revalidateTag("resource-category-reels-config", "max"); revalidateTag("resource-category-reels-data", "max"); }
  return { ok: true, message: "Recurso atualizado e registrado na auditoria." };
}

export async function saveContentCategoryAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let session;
  try { session = await authorizeAdminAction("features.manage"); } catch { return fail("Esta ação exige permissão de superadministrador."); }
  const parsed = categorySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Revise os dados da categoria.");
  const keywords = [...new Set(parsed.data.keywords.split(",").map((item) => item.trim().toLocaleLowerCase("pt-BR")).filter(Boolean))].slice(0, 20);
  const seedHashtags = [...new Set(parsed.data.seedHashtags.split(",").map((item) => item.trim().toLocaleLowerCase("pt-BR").replace(/^#/, "")).filter(Boolean))].slice(0, 20);
  const excludedTerms = [...new Set(parsed.data.excludedTerms.split(",").map((item) => item.trim().toLocaleLowerCase("pt-BR")).filter(Boolean))].slice(0, 30);
  const supabase = await createClient();
  const { data: current } = parsed.data.id ? await supabase.from("content_categories").select("slug,name,description,keywords,enabled,position").eq("id", parsed.data.id).maybeSingle() : { data: null };
  if (parsed.data.id && !current) return fail("Categoria não encontrada.");
  const enabled = parsed.data.enabled === "true";
  if (enabled && !current?.enabled && formData.get("confirmation") !== "ATIVAR") return fail("Digite ATIVAR para disponibilizar esta categoria.");
  const next = { slug: parsed.data.slug, name: parsed.data.name, description: parsed.data.description, keywords, seed_hashtags: seedHashtags, excluded_terms: excludedTerms, language: parsed.data.language, country: parsed.data.country, refresh_minutes: parsed.data.refreshMinutes, position: parsed.data.position, enabled, visible: parsed.data.visible === "true", updated_by: session.userId };
  const result = parsed.data.id ? await supabase.from("content_categories").update(next).eq("id", parsed.data.id) : await supabase.from("content_categories").insert(next);
  const { error } = result;
  if (error) return fail("Não foi possível atualizar a categoria.");
  await writeAudit({ action: current ? "content_category_updated" : "content_category_created", entityType: "content_category", entityId: parsed.data.id || parsed.data.slug, before: current, after: next });
  revalidatePath("/admin/recursos"); revalidatePath("/admin/categorias"); revalidatePath("/descobrir"); revalidatePath("/recursos/reels-por-categoria", "layout"); revalidateTag("resource-category-reels-data", "max");
  return { ok: true, message: "Categoria atualizada e registrada na auditoria." };
}

export async function deleteContentCategoryAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try { await authorizeAdminAction("features.manage"); } catch { return fail("Esta ação exige permissão de superadministrador."); }
  const parsed = z.object({ id: z.string().uuid(), slug: z.string().regex(/^[a-z0-9-]+$/), confirmation: z.string() }).safeParse(Object.fromEntries(formData));
  if (!parsed.success || parsed.data.confirmation !== `EXCLUIR ${parsed.data.slug}`) return fail(`Digite EXCLUIR ${String(formData.get("slug") || "")} para confirmar.`);
  const supabase = await createClient();
  const { data: current } = await supabase.from("content_categories").select("slug,name,enabled").eq("id", parsed.data.id).eq("slug", parsed.data.slug).maybeSingle();
  if (!current) return fail("Categoria não encontrada.");
  const { error } = await supabase.from("content_categories").delete().eq("id", parsed.data.id).eq("slug", parsed.data.slug);
  if (error) return fail("A categoria não pôde ser excluída. Desative-a se houver dados vinculados.");
  await writeAudit({ action: "content_category_deleted", entityType: "content_category", entityId: parsed.data.id, before: current, after: null });
  revalidatePath("/admin/recursos"); revalidatePath("/admin/categorias"); revalidatePath("/descobrir"); revalidatePath("/recursos/reels-por-categoria", "layout"); revalidateTag("resource-category-reels-data", "max");
  return { ok: true, message: "Categoria excluída e registrada na auditoria." };
}
