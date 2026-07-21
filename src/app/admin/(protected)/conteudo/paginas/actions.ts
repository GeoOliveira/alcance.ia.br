"use server";

import { revalidatePath, updateTag } from "next/cache";
import { authorizeAdminAction } from "@/lib/admin/auth";
import { writeAudit } from "@/lib/admin/audit";
import { createClient } from "@/lib/supabase/server";
import { getCatalogPage } from "@/lib/seo/page-catalog";
import { pageSeoFormSchema, seoImageSchema } from "@/lib/seo/page-seo-schema";
import { generatePageSeo } from "@/lib/ai/seo/generate-page-seo";
import { seoGenerationRequestSchema, type SeoGenerationOutput } from "@/lib/ai/seo/seo-generation-schema";
import type { ActionState } from "@/types/admin";
import { getPageContentDefinition } from "@/lib/content/page-content";
import { pageCatalogByKey } from "@/lib/seo/page-catalog";
import type { PageKey } from "@/lib/seo/types";

export type SeoGenerationActionResult =
  | { ok: true; message: string; cached: boolean; executionId: string; output: SeoGenerationOutput }
  | { ok: false; message: string; code: string; executionId?: string };

const generationErrors: Record<string, string> = {
  unavailable: "A infraestrutura da geração por IA não está disponível.",
  disabled: "A geração de SEO por IA está desativada nas configurações.",
  configuration: "A integração OpenAI ainda não está configurada.",
  daily_limit: "O limite diário de gerações SEO foi atingido.",
  deduplicated: "Já existe uma geração idêntica em andamento. Aguarde alguns instantes.",
  openai_rate_limit: "A OpenAI atingiu um limite temporário. Tente novamente em instantes.",
  openai_timeout: "A geração excedeu o tempo limite. Tente novamente.",
  openai_content_refusal: "A OpenAI recusou este conteúdo. Revise as orientações da página.",
  openai_incomplete_response: "A OpenAI não concluiu a sugestão. Tente novamente.",
  openai_invalid_response: "A OpenAI retornou uma sugestão fora do formato esperado.",
};

export async function savePageContentAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let session;
  try { session = await authorizeAdminAction("seo.manage"); }
  catch { return { ok: false, message: "Você não possui permissão para alterar o conteúdo da página." }; }
  const pageKey = String(formData.get("pageKey") || "") as PageKey;
  const page = pageCatalogByKey[pageKey];
  if (!page) return { ok: false, message: "Página inválida." };
  const definition = getPageContentDefinition(pageKey);
  const values: Record<string, string> = {};
  for (const item of definition.fields) {
    const value = String(formData.get(item.key) || "").trim();
    if (!value || value.length > (item.maxLength || (item.control === "textarea" ? 2000 : 300))) return { ok: false, message: `Revise o campo “${item.label}”.` };
    if (/<\s*(script|iframe|object|embed|style)/i.test(value)) return { ok: false, message: `O campo “${item.label}” contém marcação não permitida.` };
    values[item.key] = value;
  }
  const supabase = await createClient();
  const { data: before } = await supabase.from("site_content").select("content_key,content_value").eq("section", definition.section).eq("locale", "pt-BR");
  const rows = definition.fields.map((item) => ({ section: definition.section, content_key: item.key, content_value: values[item.key], content_type: item.control === "textarea" ? "text" : "short_text", locale: "pt-BR", is_active: true, updated_by: session.userId }));
  const { error } = await supabase.from("site_content").upsert(rows, { onConflict: "section,content_key,locale" });
  if (error) return { ok: false, message: "Não foi possível salvar. Confirme se a migration de conteúdo editável foi aplicada." };
  await writeAudit({ action: "page_content_updated", entityType: "site_content", entityId: pageKey, before: { rows: before || [] }, after: { keys: Object.keys(values) }, metadata: { route: page.route } });
  updateTag("home-content");
  revalidatePath(page.route);
  revalidatePath("/admin/conteudo/paginas");
  return { ok: true, message: `Conteúdo de “${page.label}” atualizado.` };
}

export async function generatePageSeoDraftAction(input: unknown): Promise<SeoGenerationActionResult> {
  let session;
  try { session = await authorizeAdminAction("seo.ai.generate"); }
  catch { return { ok: false, code: "forbidden", message: "Você não possui permissão para gerar conteúdo SEO." }; }
  const parsed = seoGenerationRequestSchema.safeParse(input);
  if (!parsed.success) return { ok: false, code: "invalid_input", message: "Revise o conteúdo e as orientações antes de gerar." };
  const result = await generatePageSeo(parsed.data, session.userId);
  try {
    await writeAudit({
      action: result.ok ? "page_seo_ai_generated" : "page_seo_ai_generation_failed",
      entityType: "page_seo",
      entityId: parsed.data.pageKey,
      after: result.ok ? { execution_id: result.executionId, cache_hit: result.cached } : null,
      metadata: { execution_id: result.executionId, code: result.ok ? "completed" : result.code },
    });
  } catch {
    // A sugestão continua utilizável mesmo se o log administrativo estiver indisponível.
  }
  if (!result.ok) return { ok: false, code: result.code, executionId: result.executionId, message: generationErrors[result.code] || "Não foi possível gerar o conteúdo SEO." };
  return { ok: true, cached: result.cached, executionId: result.executionId, output: result.output as SeoGenerationOutput, message: result.cached ? "Sugestão recuperada do cache." : "Sugestão gerada. Revise antes de aplicar." };
}

export async function savePageSeoAction(_: ActionState, formData: FormData): Promise<ActionState> {
  let session;
  try { session = await authorizeAdminAction("seo.manage"); }
  catch { return { ok: false, message: "Você não possui permissão para alterar SEO." }; }
  const parsed = pageSeoFormSchema.safeParse({
    pageKey: formData.get("pageKey"), metaTitle: formData.get("metaTitle") || "",
    metaDescription: formData.get("metaDescription") || "", metaKeywords: formData.get("metaKeywords") || "",
    ogTitle: formData.get("ogTitle") || "", ogDescription: formData.get("ogDescription") || "",
    ogImageUrl: formData.get("ogImageUrl") || "", canonicalUrl: formData.get("canonicalUrl") || "",
    indexable: formData.get("indexable"), followLinks: formData.get("followLinks"),
  });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message || "Revise os campos de SEO." };
  const page = getCatalogPage(parsed.data.pageKey);
  const imageValue = formData.get("seoImage");
  const image = imageValue instanceof File && imageValue.size > 0 ? imageValue : null;
  if (image) {
    const imageResult = seoImageSchema.safeParse({ name: image.name, type: image.type, size: image.size });
    if (!imageResult.success) return { ok: false, message: "Use uma imagem JPG, PNG ou WebP de até 2 MB." };
  }
  const aiGuidance = String(formData.get("aiGuidance") || "").trim();
  if (aiGuidance.length > 2000) return { ok: false, message: "As orientações para IA devem ter no máximo 2.000 caracteres." };
  const supabase = await createClient();
  const { data: before } = await supabase.from("page_seo_settings").select("meta_title,meta_description,meta_keywords,og_title,og_description,og_image_url,canonical_url,indexable,follow_links").eq("page_key", page.key).maybeSingle();
  let uploadedImage: { path: string; url: string } | null = null;
  if (image) {
    const extension = image.type === "image/jpeg" ? "jpg" : image.type === "image/png" ? "png" : "webp";
    const path = `${page.key}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const { error: uploadError } = await supabase.storage.from("seo-images").upload(path, image, { contentType: image.type, cacheControl: "31536000", upsert: false });
    if (uploadError) return { ok: false, message: "Não foi possível enviar a imagem SEO. Confirme se o armazenamento está configurado." };
    uploadedImage = { path, url: supabase.storage.from("seo-images").getPublicUrl(path).data.publicUrl };
  }
  const next = {
    page_key: page.key, route: page.route, meta_title: parsed.data.metaTitle,
    meta_description: parsed.data.metaDescription, meta_keywords: parsed.data.metaKeywords,
    og_title: parsed.data.ogTitle, og_description: parsed.data.ogDescription,
    og_image_url: uploadedImage?.url || parsed.data.ogImageUrl, canonical_url: parsed.data.canonicalUrl,
    indexable: parsed.data.indexable, follow_links: parsed.data.followLinks, updated_by: session.userId,
  };
  const { error } = await supabase.from("page_seo_settings").upsert(next, { onConflict: "page_key" });
  if (error) {
    if (uploadedImage) await supabase.storage.from("seo-images").remove([uploadedImage.path]);
    return { ok: false, message: "Não foi possível salvar. Confirme se a migration de SEO foi aplicada." };
  }
  const { error: briefError } = await supabase.from("page_seo_ai_briefs").upsert({ page_key: page.key, additional_guidance: aiGuidance, updated_by: session.userId }, { onConflict: "page_key" });
  if (briefError) return { ok: false, message: "O SEO foi salvo, mas as orientações da IA não. Confirme se a migration de geração SEO foi aplicada." };
  await writeAudit({ action: "page_seo_updated", entityType: "page_seo", entityId: page.key, before, after: { ...next, updated_by: undefined }, metadata: { route: page.route } });
  updateTag("page-seo");
  revalidatePath(page.route);
  revalidatePath("/admin/conteudo/paginas");
  return { ok: true, message: "SEO salvo; metadata e cache da página foram atualizados." };
}
