import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventTracker } from "@/components/analytics/event-tracker";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";
import { createClient } from "@/lib/supabase/server";
import { decideHashtagResourceAccess, findPublicHashtagDetail, getCachedPublicHashtags, getHashtagResourceConfig } from "@/lib/product-features/public-hashtags";

type Props = { params: Promise<{ hashtag: string }>; searchParams: Promise<{ categoria?: string | string[] }> };
const hashtagName = (value: string) => value.normalize("NFKC").trim().toLocaleLowerCase("pt-BR").replace(/^#+/, "").replace(/[^\p{L}\p{N}_]/gu, "").slice(0, 80);
const categoryName = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value ?? "").match(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)?.[0] ?? "";
const numberFormat = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeZone: "America/Sao_Paulo" });

async function readDetail(hashtag: string, category = "") {
  const config = await getHashtagResourceConfig();
  const items = await getCachedPublicHashtags(config.cacheMinutes);
  return { config, detail: findPublicHashtagDetail(items, hashtag, category) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const hashtag = hashtagName((await params).hashtag);
  if (!hashtag) return { title: "Hashtag não encontrada", robots: { index: false, follow: true } };
  const { config, detail } = await readDetail(hashtag);
  const title = `Conteúdos relacionados a #${hashtag}`;
  const description = detail ? `Veja uma amostra de conteúdos públicos relacionados à hashtag #${hashtag}, suas categorias e métricas observadas.` : `Detalhes da hashtag #${hashtag} na Alcance IA.`;
  const canonical = `/recursos/hashtags/${encodeURIComponent(hashtag)}`;
  return { title, description, alternates: { canonical }, robots: { index: Boolean(detail && config.indexable), follow: true }, openGraph: { type: "website", locale: "pt_BR", siteName: siteConfig.name, title, description, url: canonical, images: [{ url: "/og.png", width: 1731, height: 909, alt: `Conteúdos relacionados a #${hashtag}` }] } };
}

export default async function HashtagDetailPage({ params, searchParams }: Props) {
  const [{ hashtag: rawHashtag }, query] = await Promise.all([params, searchParams]);
  const hashtag = hashtagName(rawHashtag);
  if (!hashtag) notFound();
  const category = categoryName(query.categoria);
  const { config, detail } = await readDetail(hashtag, category);
  if (!detail) notFound();
  let isAuthenticated = false;
  try { const supabase = await createClient(); const { data } = await supabase.auth.getUser(); isAuthenticated = Boolean(data.user); } catch { /* mantém a leitura pública */ }
  const access = decideHashtagResourceAccess(config, { isAuthenticated });
  const jsonLd = { "@context": "https://schema.org", "@type": "ItemList", name: `Conteúdos relacionados a #${hashtag}`, numberOfItems: access.locked ? 0 : detail.contents.length, itemListElement: access.locked ? [] : detail.contents.map((content, index) => ({ "@type": "ListItem", position: index + 1, url: content.url, name: content.caption || `Conteúdo de @${content.username || "Instagram"}` })) };
  return <main className="hashtag-detail-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <EventTracker name="feature_viewed" properties={{ section_id: `hashtag_detail_${hashtag}` }} />
    <section className="hashtag-detail-hero"><Container><nav className="hashtags-breadcrumb" aria-label="Navegação estrutural"><Link href="/">Início</Link><span>/</span><Link href="/recursos/hashtags">Hashtags</Link><span>/</span><strong>#{hashtag}</strong></nav><div><span>CONTEÚDOS RELACIONADOS</span><h1>#{hashtag}</h1><p>Amostra de publicações públicas encontradas durante a última coleta da Alcance IA. Abrir esta página não realiza novas consultas nem consome créditos.</p><div className="hashtag-detail-summary"><div><strong>{numberFormat.format(detail.occurrences)}</strong><small>ocorrências</small></div><div><strong>{numberFormat.format(detail.contentsFound)}</strong><small>conteúdos encontrados</small></div><div><strong>{detail.contents.length}</strong><small>referências disponíveis</small></div></div></div></Container></section>
    <section className="hashtag-detail-content"><Container>
      {!access.available || access.locked ? <div className="hashtags-state is-locked"><span>✦</span><h2>Acesso controlado</h2><p>Os detalhes desta hashtag não estão disponíveis para o nível de acesso atual.</p><Link className="button button-secondary" href="/recursos/hashtags">Voltar para hashtags</Link></div> : <>
        <div className="hashtag-detail-heading"><div><span>AMOSTRA EM CACHE</span><h2>{detail.contents.length ? `${detail.contents.length} conteúdos relacionados` : "Conteúdos ainda não disponíveis"}</h2><p>{detail.categories.join(" · ")} · atualizado em {dateFormat.format(new Date(detail.updatedAt))}</p></div><Link href="/recursos/hashtags">← Todas as hashtags</Link></div>
        {detail.contents.length ? <div className="hashtag-content-grid">{detail.contents.map((content) => <article key={content.id}><div className="hashtag-content-media">{content.thumbnailUrl ? <Image src={content.thumbnailUrl} alt={content.caption ? `Publicação relacionada a #${hashtag}` : `Conteúdo de @${content.username || "Instagram"}`} fill sizes="(max-width: 700px) 100vw, (max-width: 1000px) 50vw, 33vw" /> : <span aria-hidden="true">#</span>}</div><div className="hashtag-content-body"><header><strong>{content.username ? `@${content.username}` : "Conteúdo público"}</strong>{content.publishedAt && <time dateTime={content.publishedAt}>{dateFormat.format(new Date(content.publishedAt))}</time>}</header><p>{content.caption || "Publicação pública relacionada à hashtag selecionada."}</p><dl><div><dt>Curtidas</dt><dd>{numberFormat.format(content.likes)}</dd></div><div><dt>Comentários</dt><dd>{numberFormat.format(content.comments)}</dd></div>{content.views > 0 && <div><dt>Visualizações</dt><dd>{numberFormat.format(content.views)}</dd></div>}</dl><a href={content.url} target="_blank" rel="noopener noreferrer">Abrir no Instagram <span aria-hidden="true">↗</span></a></div></article>)}</div> : <div className="hashtags-state"><span>◷</span><h3>É necessário atualizar o snapshot</h3><p>Este resultado foi criado antes do armazenamento das referências de conteúdo. Execute novamente “COLETAR HASHTAGS” em /admin/recursos para preencher esta seção.</p><Link className="button button-secondary" href="/recursos/hashtags">Voltar para hashtags</Link></div>}
        {detail.related.length > 0 && <div className="hashtag-detail-related"><strong>Explore hashtags relacionadas</strong><div>{detail.related.map((related) => <Link href={`/recursos/hashtags/${encodeURIComponent(related)}${category ? `?categoria=${encodeURIComponent(category)}` : ""}`} key={related}>#{related}</Link>)}</div></div>}
      </>}
    </Container></section>
  </main>;
}
