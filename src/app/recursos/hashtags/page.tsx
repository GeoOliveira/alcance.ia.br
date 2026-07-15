import type { Metadata } from "next";
import Link from "next/link";
import { EventTracker } from "@/components/analytics/event-tracker";
import { AnalyticsLink } from "@/components/analytics/analytics-link";
import { FeatureInterestButton } from "@/components/product-features/feature-interest-button";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";
import { createClient } from "@/lib/supabase/server";
import { listActiveContentCategories } from "@/lib/product-features/discovery";
import { decideHashtagResourceAccess, filterPublicHashtags, getCachedPublicHashtags, getHashtagResourceConfig, getMostRecurringHashtags, type HashtagFilters, type HashtagPopularity, type HashtagTrend } from "@/lib/product-features/public-hashtags";

const title = "Descobrir hashtags relevantes para Instagram";
const description = "Pesquise hashtags recorrentes, em crescimento e relacionadas por categoria usando snapshots públicos atualizados da Alcance IA.";
const canonical = "/recursos/hashtags";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getHashtagResourceConfig();
  const indexable = config.indexable && config.enabled && config.flagEnabled && config.visibility !== "hidden";
  return { title, description, alternates: { canonical }, robots: { index: indexable, follow: true }, openGraph: { type: "website", locale: "pt_BR", siteName: siteConfig.name, title, description, url: canonical, images: [{ url: "/og.png", width: 1731, height: 909, alt: "Descoberta de hashtags da Alcance IA" }] }, twitter: { card: "summary_large_image", title, description, images: ["/og.png"] } };
}

type SearchParams = { q?: string | string[]; categoria?: string | string[]; periodo?: string | string[]; tendencia?: string | string[]; popularidade?: string | string[]; pagina?: string | string[] };
const one = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] ?? "" : value ?? "";
const safeOption = <T extends string>(value: string, options: readonly T[], fallback: T) => options.includes(value as T) ? value as T : fallback;

function filtersHref(filters: HashtagFilters, page: number) {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (filters.category) params.set("categoria", filters.category);
  if (filters.period && filters.period !== "30") params.set("periodo", filters.period);
  if (filters.trend) params.set("tendencia", filters.trend);
  if (filters.popularity) params.set("popularidade", filters.popularity);
  if (page > 1) params.set("pagina", String(page));
  const query = params.toString();
  return query ? `${canonical}?${query}` : canonical;
}

const trendLabels: Record<HashtagTrend, string> = { alta: "Em alta", estável: "Estável", baixa: "Em baixa" };
const popularityLabels: Record<HashtagPopularity, string> = { alta: "Alta", média: "Média", baixa: "Baixa" };
const numberFormat = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeZone: "America/Sao_Paulo" });

export default async function HashtagResourcePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [params, config, categories] = await Promise.all([searchParams, getHashtagResourceConfig(), listActiveContentCategories()]);
  let isAuthenticated = false;
  try { const supabase = await createClient(); const { data } = await supabase.auth.getUser(); isAuthenticated = Boolean(data.user); } catch { /* acesso anônimo continua disponível quando o recurso é público */ }
  const access = decideHashtagResourceAccess(config, { isAuthenticated });
  const filters: HashtagFilters = {
    query: one(params.q).trim().slice(0, 80),
    category: safeOption(one(params.categoria), categories.map((category) => category.slug), ""),
    period: safeOption(one(params.periodo), ["7", "30", "90"] as const, "30"),
    trend: safeOption(one(params.tendencia), ["", "alta", "estável", "baixa"] as const, ""),
    popularity: safeOption(one(params.popularidade), ["", "alta", "média", "baixa"] as const, ""),
  };
  const allItems = access.available && !access.locked ? await getCachedPublicHashtags(config.cacheMinutes) : [];
  const mostRecurring = getMostRecurringHashtags(allItems, 8);
  const filtered = filterPublicHashtags(allItems, filters, config.maxItems);
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const requestedPage = Math.max(1, Number.parseInt(one(params.pagina), 10) || 1);
  const currentPage = Math.min(requestedPage, totalPages);
  const items = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const hasFilters = Boolean(filters.query || filters.category || filters.trend || filters.popularity || filters.period !== "30");
  const jsonLd = [
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Início", item: siteConfig.url }, { "@type": "ListItem", position: 2, name: "Recursos", item: `${siteConfig.url}/recursos` }, { "@type": "ListItem", position: 3, name: "Hashtags", item: `${siteConfig.url}${canonical}` }] },
    { "@context": "https://schema.org", "@type": "WebApplication", name: title, description, url: `${siteConfig.url}${canonical}`, applicationCategory: "BusinessApplication", operatingSystem: "Web", inLanguage: "pt-BR", isAccessibleForFree: config.audience !== "premium" },
    { "@context": "https://schema.org", "@type": "ItemList", name: "Hashtags relevantes do Instagram", numberOfItems: items.length, itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: (currentPage - 1) * pageSize + index + 1, name: `#${item.hashtag}` })) },
  ];
  return <main className="hashtags-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <EventTracker name="feature_viewed" properties={{ section_id: "resource_hashtags" }} />
    <section className="hashtags-hero"><Container><nav className="hashtags-breadcrumb" aria-label="Navegação estrutural"><Link href="/">Início</Link><span>/</span><Link href="/recursos">Recursos</Link><span>/</span><strong>Hashtags</strong></nav><div className="hashtags-hero-grid"><div><span className="hashtags-eyebrow">DESCOBERTA DE HASHTAGS</span><h1>Encontre hashtags com sinais reais de relevância.</h1><p>Explore recorrência, tendência e popularidade por categoria. Os resultados vêm de snapshots válidos e abrir esta página nunca inicia uma nova coleta.</p><div className="hashtags-hero-pills"><span>Sem login</span><span>Dados em cache</span><span>Filtros por categoria</span></div></div><div className="hashtags-hero-visual" aria-hidden="true"><i>#conteúdo</i><i>#instagram</i><i>#marketing</i><i>#tendências</i><strong>↗</strong></div></div></Container></section>
    <section className="hashtags-content"><Container>
      {!access.available ? <div className="hashtags-state"><span>◌</span><h2>Ferramenta temporariamente indisponível</h2><p>O recurso foi pausado no catálogo administrativo. Volte em outro momento.</p></div> : access.locked ? <div className="hashtags-state is-locked"><span>✦</span><h2>{access.reason === "premium_required" ? "Recurso Premium" : access.reason === "authentication_required" ? "Entre para continuar" : "Acesso controlado"}</h2><p>A ferramenta permanece visível, mas os resultados dependem do nível de acesso configurado.</p>{access.reason === "authentication_required" ? <Link className="button" href="/login">Entrar gratuitamente</Link> : <FeatureInterestButton featureKey="resource_hashtags" source="resources_page" />}</div> : <>
        {mostRecurring.length > 0 && <section className="hashtags-recurring" aria-labelledby="hashtags-recurring-title"><div className="hashtags-recurring-heading"><div><span>AMOSTRA PÚBLICA ATUAL</span><h2 id="hashtags-recurring-title">Hashtags mais recorrentes</h2><p>As ocorrências são calculadas nos posts públicos encontrados pelas categorias monitoradas, com remoção de duplicatas dentro de cada amostra.</p></div><strong>{allItems.length} sinais catalogados</strong></div><div className="hashtags-recurring-grid">{mostRecurring.map((item, index) => <Link href={filtersHref({ query: item.hashtag, period: "30" }, 1)} key={item.hashtag}><span>{String(index + 1).padStart(2, "0")}</span><div><strong>#{item.hashtag}</strong><small>{item.categories.slice(0, 2).join(" · ")}{item.categories.length > 2 ? ` +${item.categories.length - 2}` : ""}</small></div><b>{numberFormat.format(item.occurrences)}<small>ocorrências</small></b></Link>)}</div></section>}
        <form className="hashtags-filters" method="get" role="search"><div className="hashtags-search"><label htmlFor="hashtag-query">Pesquisar hashtag</label><div><span aria-hidden="true">#</span><input id="hashtag-query" name="q" defaultValue={filters.query} placeholder="marketing, moda, gastronomia..." maxLength={80} /><button type="submit">Pesquisar</button></div></div><div className="hashtags-filter-grid"><label>Categoria<select name="categoria" defaultValue={filters.category}><option value="">Todas as categorias</option>{categories.map((category) => <option value={category.slug} key={category.id}>{category.name}</option>)}</select></label><label>Período<select name="periodo" defaultValue={filters.period}><option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option></select></label><label>Tendência<select name="tendencia" defaultValue={filters.trend}><option value="">Todas</option><option value="alta">Em alta</option><option value="estável">Estável</option><option value="baixa">Em baixa</option></select></label><label>Popularidade<select name="popularidade" defaultValue={filters.popularity}><option value="">Todas</option><option value="alta">Alta</option><option value="média">Média</option><option value="baixa">Baixa</option></select></label><button type="submit">Aplicar filtros</button></div></form>
        <div className="hashtags-results-heading"><div><span>RESULTADOS EM CACHE</span><h2>{filtered.length ? `${filtered.length} hashtags encontradas` : allItems.length ? "Nenhuma hashtag corresponde aos filtros" : "Base de hashtags em atualização"}</h2></div>{hasFilters && <Link href={canonical}>Limpar filtros</Link>}</div>
        {items.length ? <div className="hashtags-grid">{items.map((item) => <article className="hashtag-card" key={item.id}><header><strong>#{item.hashtag}</strong><span data-trend={item.trend}>{item.trend === "alta" ? "↗" : item.trend === "baixa" ? "↘" : "→"} {trendLabels[item.trend]}</span></header><div className="hashtag-card-metrics"><div><span>Ocorrências</span><b>{numberFormat.format(item.occurrences)}</b></div><div><span>Conteúdos</span><b>{numberFormat.format(item.contentsFound)}</b></div></div><dl><div><dt>Categoria</dt><dd>{item.category}</dd></div><div><dt>Popularidade</dt><dd data-popularity={item.popularity}>{popularityLabels[item.popularity]}</dd></div><div><dt>Atualização</dt><dd>{dateFormat.format(new Date(item.updatedAt))}</dd></div></dl>{item.related.length > 0 && <div className="hashtag-related"><span>Relacionadas</span><div>{item.related.map((related) => <Link href={filtersHref({ ...filters, query: related }, 1)} key={related}>#{related}</Link>)}</div></div>}<AnalyticsLink className="hashtag-card-link" href={`/recursos/hashtags/${encodeURIComponent(item.hashtag)}?categoria=${encodeURIComponent(item.categorySlug)}`} eventName="feature_viewed" properties={{ section_id: `hashtag_${item.hashtag}`, cta_location: "resource_hashtags_card" }}>{item.contents.length ? "Ver conteúdos relacionados" : "Ver detalhes da hashtag"} <span aria-hidden="true">↗</span></AnalyticsLink></article>)}</div> : <div className="hashtags-state"><span>{allItems.length ? "⌕" : "◷"}</span><h3>{allItems.length ? "Sem resultados" : "Ainda não há snapshots válidos"}</h3><p>{allItems.length ? "Tente remover algum filtro ou pesquisar um termo mais amplo." : config.automaticRefresh ? "A atualização automática está habilitada e publicará resultados quando um snapshot for concluído." : "Nenhuma consulta externa será iniciada por esta página. O administrador pode publicar snapshots quando estiverem disponíveis."}</p>{allItems.length > 0 && <Link className="button button-secondary" href={canonical}>Ver todas as hashtags</Link>}</div>}
        {filtered.length > pageSize && <nav className="hashtags-pagination" aria-label="Paginação das hashtags"><Link aria-disabled={currentPage === 1} href={filtersHref(filters, Math.max(1, currentPage - 1))}>← Anterior</Link><span>Página <strong>{currentPage}</strong> de {totalPages}</span><Link aria-disabled={currentPage === totalPages} href={filtersHref(filters, Math.min(totalPages, currentPage + 1))}>Próxima →</Link></nav>}
        <div className="hashtags-method"><strong>Como os resultados são preparados</strong><p>A Alcance IA consulta amostras de posts públicos a partir das hashtags-semente de cada categoria, elimina posts repetidos dentro da amostra e publica somente dados agregados. “Mais recorrentes” descreve essa amostra, não todo o Instagram. Frequência e tendência não garantem alcance nem atribuem causalidade à hashtag.</p><span>Cache atual: {config.cacheMinutes} minutos · limite: {config.maxItems} hashtags</span></div>
      </>}
    </Container></section>
  </main>;
}
