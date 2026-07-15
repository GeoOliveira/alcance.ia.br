"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authorizeAdminAction } from "@/lib/admin/auth";
import { writeAudit } from "@/lib/admin/audit";
import { createClient } from "@/lib/supabase/server";
import { productFeatureKeys } from "@/lib/product-features/catalog";
import type { ActionState } from "@/types/admin";

const featureSchema = z.object({
  key: z.enum(productFeatureKeys),
  audience: z.enum(["public", "free", "premium", "admin"]),
  status: z.enum(["development", "beta", "active", "disabled"]),
  visibility: z.enum(["hidden", "preview", "full"]),
  enabled: z.enum(["true", "false"]),
  maxItems: z.coerce.number().int().min(1).max(100),
  dailyRequests: z.coerce.number().int().min(0).max(10000),
  cacheMinutes: z.coerce.number().int().min(0).max(10080),
  estimatedCreditCost: z.coerce.number().min(0).max(10000),
  dependencies: z.string().max(1000),
});
const categorySchema = z.object({ id: z.string().uuid().or(z.literal("")), slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80), name: z.string().trim().min(2).max(80), description: z.string().trim().max(500), keywords: z.string().max(500), seedHashtags: z.string().max(500), excludedTerms: z.string().max(500), language: z.string().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/), country: z.string().regex(/^[A-Z]{2}$/), refreshMinutes: z.coerce.number().int().min(60).max(10080), position: z.coerce.number().int().min(0).max(10000), enabled: z.enum(["true", "false"]), visible: z.enum(["true", "false"]) });
const fail = (message: string): ActionState => ({ ok: false, message });

export async function updateProductFeatureAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let session;
  try { session = await authorizeAdminAction("features.manage"); } catch { return fail("Esta ação exige permissão de superadministrador."); }
  const parsed = featureSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fail("Revise o estado, o acesso e os limites informados.");
  const supabase = await createClient();
  const { data: current } = await supabase.from("product_features").select("key,audience,status,visibility,enabled,requires_provider_call,estimated_credit_cost,dependencies,limits").eq("key", parsed.data.key).maybeSingle();
  if (!current) return fail("Recurso não encontrado no catálogo persistido.");
  const enabled = parsed.data.enabled === "true";
  const dependencies = [...new Set(parsed.data.dependencies.split(",").map((item) => item.trim()).filter((item) => productFeatureKeys.includes(item as (typeof productFeatureKeys)[number])))];
  const currentLimits = current.limits as Record<string, number>;
  const critical = (!enabled && current.enabled && current.visibility === "full") || (parsed.data.audience === "premium" && current.audience !== "premium") || (enabled && parsed.data.status === "beta" && (!current.enabled || current.status !== "beta")) || (enabled && !current.enabled && current.requires_provider_call) || parsed.data.dailyRequests > (currentLimits.dailyRequests ?? 0) || parsed.data.estimatedCreditCost > Number(current.estimated_credit_cost || 0) || dependencies.join("|") !== (current.dependencies || []).join("|");
  if (critical && formData.get("confirmation") !== "ATIVAR") return fail("Digite ATIVAR para confirmar um recurso com consumo externo ou acesso premium completo.");
  const limits = { maxItems: parsed.data.maxItems, dailyRequests: parsed.data.dailyRequests, cacheMinutes: parsed.data.cacheMinutes };
  const next = { audience: parsed.data.audience, status: parsed.data.status, visibility: parsed.data.visibility, enabled, estimated_credit_cost: parsed.data.estimatedCreditCost, dependencies, limits, updated_by: session.userId };
  const { error } = await supabase.from("product_features").update(next).eq("key", current.key);
  if (error) return fail("Não foi possível atualizar o recurso.");
  await writeAudit({ action: "product_feature_updated", entityType: "product_feature", entityId: current.key, before: { audience: current.audience, status: current.status, visibility: current.visibility, enabled: current.enabled, estimated_credit_cost: current.estimated_credit_cost, dependencies: current.dependencies, limits: current.limits }, after: next });
  revalidatePath("/admin/recursos"); revalidatePath("/recursos"); revalidatePath("/analisar/[requestId]", "page");
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
  revalidatePath("/admin/recursos"); revalidatePath("/descobrir");
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
  revalidatePath("/admin/recursos"); revalidatePath("/descobrir");
  return { ok: true, message: "Categoria excluída e registrada na auditoria." };
}
