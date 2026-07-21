"use client";

import { useActionState, useRef, useState, useTransition } from "react";
import { generatePageSeoDraftAction, savePageSeoAction, type SeoGenerationActionResult } from "./actions";
import { pageSeoBriefDefaults } from "@/lib/ai/seo/page-brief-defaults";
import type { PageCatalogEntry, PageSeoAIBrief, PageSeoSettings } from "@/lib/seo/types";
import type { ActionState } from "@/types/admin";

const initialState: ActionState = { ok: false, message: "" };
function textTitle(page: PageCatalogEntry) { return typeof page.defaults.title === "string" ? page.defaults.title : page.label; }

export function SeoEditor({ page, setting, brief }: { page: PageCatalogEntry; setting: PageSeoSettings | null; brief: PageSeoAIBrief | null }) {
  const [dirty, setDirty] = useState(false);
  const [state, action, saving] = useActionState(async (previous: ActionState, formData: FormData) => {
    const result = await savePageSeoAction(previous, formData);
    if (result.ok) setDirty(false);
    return result;
  }, initialState);
  const [generating, startGeneration] = useTransition();
  const dialog = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState(setting?.meta_title || "");
  const [description, setDescription] = useState(setting?.meta_description || "");
  const [keywords, setKeywords] = useState(setting?.meta_keywords.join(", ") || "");
  const [ogTitle, setOgTitle] = useState(setting?.og_title || "");
  const [ogDescription, setOgDescription] = useState(setting?.og_description || "");
  const [imageUrl, setImageUrl] = useState(setting?.og_image_url || "");
  const [imagePreview, setImagePreview] = useState(setting?.og_image_url || "/og.png");
  const [aiGuidance, setAiGuidance] = useState(brief?.additional_guidance || "");
  const [generation, setGeneration] = useState<SeoGenerationActionResult | null>(null);
  const fallbackTitle = textTitle(page);
  const fallbackDescription = String(page.defaults.description || "");
  const defaultBrief = pageSeoBriefDefaults[page.key];

  function generate(bypassCache = false) {
    setGeneration(null);
    startGeneration(async () => {
      const result = await generatePageSeoDraftAction({
        pageKey: page.key,
        additionalGuidance: aiGuidance,
        current: { metaTitle: title, metaDescription: description, metaKeywords: keywords, openGraphTitle: ogTitle, openGraphDescription: ogDescription },
        bypassCache,
      });
      setGeneration(result);
    });
  }

  function openGenerator() {
    setGeneration(null);
    dialog.current?.showModal();
    generate(false);
  }

  function applySuggestion() {
    if (!generation?.ok) return;
    setTitle(generation.output.metaTitle);
    setDescription(generation.output.metaDescription);
    setKeywords(generation.output.metaKeywords.join(", "));
    setOgTitle(generation.output.openGraphTitle);
    setOgDescription(generation.output.openGraphDescription);
    setDirty(true);
    dialog.current?.close();
  }

  function previewSelectedImage(file: File | undefined) {
    if (!file) { setImagePreview(imageUrl || "/og.png"); return; }
    const reader = new FileReader();
    reader.onload = () => { if (typeof reader.result === "string") setImagePreview(reader.result); };
    reader.readAsDataURL(file);
  }

  return <details className="admin-seo-editor" open>
    <summary><span><strong>Controles SEO de {page.label}</strong><small>{page.route}</small></span><span className="admin-seo-summary-state">{setting?.meta_title || setting?.meta_description || setting?.og_image_url ? "Personalizado" : "Usando padrão"}</span><i aria-hidden="true">⌄</i></summary>
    <form action={action} className="admin-form admin-seo-form" onChange={() => setDirty(true)}>
      <input type="hidden" name="pageKey" value={page.key} />
      <div className="admin-seo-ai-bar"><div><strong>Assistente de SEO</strong><span>Gere um rascunho com a integração OpenAI e revise antes de salvar.</span></div><button type="button" className="admin-secondary-button" onClick={openGenerator} disabled={generating}>{generating ? "Gerando…" : "Gerar conteúdo"}</button></div>
      <div className="admin-seo-fields"><label>Meta título <input name="metaTitle" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={70} placeholder={fallbackTitle} /><small>{title.length}/70 · recomendado: 20–70</small></label>
      <label>Meta descrição <textarea name="metaDescription" value={description} onChange={(event) => setDescription(event.target.value)} maxLength={180} placeholder={fallbackDescription} /><small>{description.length}/180 · recomendado: 60–180</small></label>
      <label>Meta tags <input name="metaKeywords" value={keywords} onChange={(event) => setKeywords(event.target.value)} maxLength={1000} placeholder="análise de Instagram, métricas" /><small>Até 20 itens, separados por vírgula.</small></label>
      <label>Canonical HTTPS <input name="canonicalUrl" type="url" defaultValue={setting?.canonical_url || ""} maxLength={2048} placeholder={`Padrão: ${page.route}`} /></label></div>
      <fieldset><legend>Imagem SEO e compartilhamento</legend><div className="admin-seo-fields"><label>Título Open Graph <input name="ogTitle" value={ogTitle} onChange={(event) => setOgTitle(event.target.value)} maxLength={90} placeholder={title || fallbackTitle} /><small>{ogTitle.length}/90</small></label><label>Descrição Open Graph <textarea name="ogDescription" value={ogDescription} onChange={(event) => setOgDescription(event.target.value)} maxLength={220} placeholder={description || fallbackDescription} /><small>{ogDescription.length}/220</small></label><label>URL da imagem SEO <input name="ogImageUrl" type="url" value={imageUrl} onChange={(event) => { setImageUrl(event.target.value); setImagePreview(event.target.value || "/og.png"); }} maxLength={2048} placeholder="https://…/imagem.webp" /><small>Use uma URL HTTPS ou envie um arquivo abaixo.</small></label><label>Enviar imagem SEO <input name="seoImage" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => previewSelectedImage(event.target.files?.[0])} /><small>JPG, PNG ou WebP · até 2 MB · recomendado 1200 × 630 px.</small></label></div><div className="admin-seo-image-preview" style={{ backgroundImage: `url(${JSON.stringify(imagePreview)})` }} role="img" aria-label={`Prévia da imagem SEO de ${page.label}`} /></fieldset>
      <fieldset className="admin-seo-ai-guidance"><legend>Orientações individuais para a IA</legend><p>Briefing padrão: {defaultBrief.purpose} Palavra-chave principal: <strong>{defaultBrief.primaryKeyword}</strong>.</p><label>Complemento opcional<textarea name="aiGuidance" value={aiGuidance} onChange={(event) => setAiGuidance(event.target.value)} maxLength={2000} placeholder="Ex.: priorize o público de agências e evite mencionar recursos ainda não lançados." /><small>{aiGuidance.length}/2000 · estas orientações complementam, mas não substituem, as regras globais.</small></label></fieldset>
      <fieldset><legend>Robôs</legend><div className="admin-seo-switches"><label>Indexação<select name="indexable" defaultValue={String(setting?.indexable ?? true)}><option value="true">Permitir indexação</option><option value="false">Não indexar</option></select></label><label>Links<select name="followLinks" defaultValue={String(setting?.follow_links ?? true)}><option value="true">Seguir links</option><option value="false">nofollow</option></select></label></div></fieldset>
      <div className="admin-preview-grid"><article className="admin-search-preview"><span>Prévia do Google</span><h3>{title || fallbackTitle}</h3><small>alcance.ia.br{page.route}</small><p>{description || fallbackDescription}</p></article><article className="admin-social-preview"><div style={{ backgroundImage: `url(${JSON.stringify(imagePreview)})` }} /><span>ALCANCE.IA.BR</span><h3>{ogTitle || title || fallbackTitle}</h3><p>{ogDescription || description || fallbackDescription}</p></article></div>
      <div className="admin-seo-footer"><span className={dirty ? "is-dirty" : ""}>{dirty ? "Alterações não salvas" : state.ok ? "Salvo" : setting ? `Atualizado em ${new Date(setting.updated_at).toLocaleString("pt-BR")}${setting.updated_by ? ` · responsável ${setting.updated_by.slice(0, 8)}` : ""}` : "Sem personalização"}</span>{state.message && <p className={state.ok ? "admin-success" : "admin-error"} role="status">{state.message}</p>}<button className="admin-primary-button" disabled={saving}>{saving ? "Salvando…" : "Salvar SEO"}</button></div>

      <dialog ref={dialog} className="admin-dialog admin-seo-ai-dialog" aria-labelledby={`seo-ai-title-${page.key}`} onClose={() => setGeneration(null)}>
        <div className="admin-seo-ai-dialog-head"><div><span>RASCUNHO POR IA</span><h2 id={`seo-ai-title-${page.key}`}>{page.label}</h2></div><button type="button" aria-label="Fechar" onClick={() => dialog.current?.close()}>×</button></div>
        {generating && <div className="admin-seo-ai-loading" role="status"><strong>Gerando conteúdo…</strong><span>A IA está combinando as regras globais com o briefing desta página.</span></div>}
        {generation && !generation.ok && <div className="admin-seo-ai-error" role="alert"><strong>Não foi possível gerar</strong><p>{generation.message}</p><button type="button" className="admin-secondary-button" onClick={() => generate(true)}>Tentar novamente</button></div>}
        {generation?.ok && <><p>{generation.message} Nenhum campo foi alterado ainda.</p><div className="admin-seo-ai-comparison">
          <article><span>Meta título</span><small>Atual</small><p>{title || "—"}</p><small>Sugestão</small><strong>{generation.output.metaTitle}</strong></article>
          <article><span>Meta descrição</span><small>Atual</small><p>{description || "—"}</p><small>Sugestão</small><strong>{generation.output.metaDescription}</strong></article>
          <article><span>Meta tags</span><small>Sugestão</small><strong>{generation.output.metaKeywords.join(", ")}</strong></article>
          <article><span>Open Graph</span><small>Título sugerido</small><strong>{generation.output.openGraphTitle}</strong><small>Descrição sugerida</small><p>{generation.output.openGraphDescription}</p></article>
        </div><div className="admin-form-actions"><button type="button" className="admin-secondary-button" onClick={() => dialog.current?.close()}>Cancelar</button><button type="button" className="admin-secondary-button" onClick={() => generate(true)} disabled={generating}>Gerar novamente</button><button type="button" className="admin-primary-button" onClick={applySuggestion}>Aplicar ao formulário</button></div></>}
      </dialog>
    </form>
  </details>;
}
