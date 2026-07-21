import Link from "next/link";
import { requireAdminSession } from "@/lib/admin/auth";
import { createClient } from "@/lib/supabase/server";
import { pageCatalog, pageCatalogByKey } from "@/lib/seo/page-catalog";
import type { PageKey } from "@/lib/seo/types";
import type { PageSeoAIBrief, PageSeoSettings } from "@/lib/seo/types";
import { AdminPageHeader } from "@/components/admin/admin-ui";
import { SeoEditor } from "./seo-editor";
import { AdminActionForm } from "@/components/admin/admin-action-form";
import { getPageContentDefinition } from "@/lib/content/page-content";
import { savePageContentAction } from "./actions";

export default async function SeoPagesAdminPage({ searchParams }: { searchParams: Promise<{ pagina?: string }> }) {
  await requireAdminSession("seo.manage");
  const params = await searchParams;
  const selectedKey = params.pagina && Object.hasOwn(pageCatalogByKey, params.pagina) ? params.pagina as PageKey : "home";
  const selectedPage = pageCatalogByKey[selectedKey];
  const contentDefinition = getPageContentDefinition(selectedKey);
  const supabase = await createClient();
  const [result, briefResult, contentResult] = await Promise.all([
    supabase.from("page_seo_settings").select("id,page_key,route,meta_title,meta_description,meta_keywords,og_title,og_description,og_image_url,canonical_url,indexable,follow_links,created_at,updated_at,updated_by"),
    supabase.from("page_seo_ai_briefs").select("page_key,additional_guidance,updated_at,updated_by"),
    supabase.from("site_content").select("content_key,content_value").eq("section", contentDefinition.section).eq("locale", "pt-BR"),
  ]);
  const rows = (result.data || []) as PageSeoSettings[];
  const briefs = (briefResult.data || []) as PageSeoAIBrief[];
  const pageContent = Object.fromEntries((contentResult.data || []).map((row) => [row.content_key, row.content_value]));
  return <><AdminPageHeader eyebrow="CONTEÚDO E DESCOBERTA" title="Conteúdo das páginas" description="Cada aba reúne os textos públicos e o SEO de uma única página. Campos não personalizados preservam o fallback seguro da aplicação." />
    {result.error && <p className="admin-note" role="status">A migration de SEO ainda não está disponível neste ambiente. Os padrões continuam ativos; aplique a migration local para salvar alterações.</p>}
    {briefResult.error && <p className="admin-note" role="status">A migration de geração SEO ainda não está disponível. O editor continua funcionando, mas a IA permanecerá indisponível.</p>}
    <div className="admin-seo-overview"><article><strong>{pageCatalog.length}</strong><span>Páginas registradas</span></article><article><strong>{rows.filter((row) => row.meta_title || row.meta_description).length}</strong><span>Personalizadas</span></article><article><strong>{rows.filter((row) => !row.indexable).length}</strong><span>Não indexáveis</span></article><article><strong>Fallback ativo</strong><span>Banco → página → aplicação</span></article></div>
    <nav className="admin-page-tabs" aria-label="Páginas editáveis">{pageCatalog.map((page) => <Link href={`/admin/conteudo/paginas?pagina=${page.key}`} aria-current={page.key === selectedKey ? "page" : undefined} key={page.key}><span>{page.group}</span><strong>{page.label}</strong></Link>)}</nav>
    <section className="admin-page-editor-head"><div><span>{selectedPage.group.toUpperCase()}</span><h2>{selectedPage.label}</h2><p>{selectedPage.route}</p></div><Link className="admin-secondary-button" href={selectedPage.route} target="_blank" rel="noopener noreferrer">Abrir página ↗</Link></section>
    <section className="admin-page-seo-section"><div className="admin-panel-header"><div><h2>SEO e compartilhamento</h2><p>Meta título, meta descrição, imagem social, indexação e assistência por IA desta página.</p></div></div><div className="admin-seo-list"><SeoEditor page={selectedPage} setting={rows.find((row) => row.page_key === selectedKey) || null} brief={briefs.find((row) => row.page_key === selectedKey) || null} /></div></section>
    {contentResult.error && <p className="admin-note" role="status">A migration de conteúdo editável ainda não está disponível. Os textos padrão continuam ativos; aplique a migration para salvar personalizações.</p>}
    <section className="admin-panel admin-page-content-editor"><div className="admin-panel-header"><div><h2>Conteúdo da página</h2><p>Textos simples e estruturados, sem HTML ou JavaScript.</p></div><small>{contentDefinition.fields.length} campos</small></div><AdminActionForm action={savePageContentAction} className="admin-form admin-page-content-form" submitLabel="Salvar conteúdo da página">
      <input type="hidden" name="pageKey" value={selectedKey} />
      <div className="admin-page-content-grid">{contentDefinition.fields.map((item) => <label key={item.key}>{item.label}{item.control === "textarea" ? <textarea name={item.key} rows={item.rows || 3} maxLength={item.maxLength || 2000} defaultValue={pageContent[item.key] || item.defaultValue} required /> : <input name={item.key} maxLength={item.maxLength || 300} defaultValue={pageContent[item.key] || item.defaultValue} required />}{item.help && <small>{item.help}</small>}</label>)}</div>
    </AdminActionForm></section>
  </>;
}
