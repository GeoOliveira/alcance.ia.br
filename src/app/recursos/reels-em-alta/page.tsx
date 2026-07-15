/* eslint-disable @next/next/no-img-element -- URLs de snapshots externos são dinâmicas e permanecem sem proxy. */
import type { Metadata } from "next";
import Link from "next/link";
import { EventTracker } from "@/components/analytics/event-tracker";
import { FeatureInterestButton } from "@/components/product-features/feature-interest-button";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";
import { createClient } from "@/lib/supabase/server";
import { decideTrendingReelsResourceAccess, filterAndSortTrendingReels, getCachedPublicTrendingReels, getTrendingReelsResourceConfig, type TrendingReelFilters, type TrendingReelSort } from "@/lib/product-features/public-trending-reels";

const title = "Reels em alta: tendências e destaques";
const description = "Explore uma amostra pública de Reels em destaque, com métricas, áudio, categoria estimada e filtros atualizados periodicamente.";
const canonical = "/recursos/reels-em-alta";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getTrendingReelsResourceConfig();
  const indexable = config.indexable && config.enabled && config.flagEnabled && config.visibility !== "hidden";
  return { title, description, alternates: { canonical }, robots: { index: indexable, follow: true }, openGraph: { type: "website", locale: "pt_BR", siteName: siteConfig.name, title, description, url: canonical, images: [{ url: "/og.png", width: 1731, height: 909, alt: "Amostra pública de Reels em destaque" }] }, twitter: { card: "summary_large_image", title, description, images: ["/og.png"] } };
}

type SearchParams = { periodo?: string | string[]; categoria?: string | string[]; idioma?: string | string[]; pais?: string | string[]; minimo?: string | string[]; ordenar?: string | string[]; pagina?: string | string[] };
const one = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] ?? "" : value ?? "";
const safeOption = <T extends string>(value: string, options: readonly T[], fallback: T) => options.includes(value as T) ? value as T : fallback;
const compactNumber = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeZone: "America/Sao_Paulo" });
const percentFormat = new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });

function filtersHref(filters: TrendingReelFilters, page: number) {
  const params = new URLSearchParams();
  if (filters.period && filters.period !== "30") params.set("periodo", filters.period);
  if (filters.category) params.set("categoria", filters.category);
  if (filters.language) params.set("idioma", filters.language);
  if (filters.country) params.set("pais", filters.country);
  if (filters.minimumViews) params.set("minimo", String(filters.minimumViews));
  if (filters.sort && filters.sort !== "views") params.set("ordenar", filters.sort);
  if (page > 1) params.set("pagina", String(page));
  const query = params.toString();
  return query ? `${canonical}?${query}` : canonical;
}

const sortLabels: Record<TrendingReelSort, string> = { views: "Visualizações", engagement: "Engajamento", relative_performance: "Desempenho proporcional", recent: "Mais recentes" };

export default async function TrendingReelsResourcePage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const [params, config] = await Promise.all([searchParams, getTrendingReelsResourceConfig()]);
  let isAuthenticated = false;
  try { const supabase = await createClient(); const { data } = await supabase.auth.getUser(); isAuthenticated = Boolean(data.user); } catch { /* o acesso público continua sem sessão */ }
  const access = decideTrendingReelsResourceAccess(config, { isAuthenticated });
  const allItems = access.available && !access.locked ? await getCachedPublicTrendingReels(config.cacheMinutes) : [];
  const categories = [...new Map(allItems.map((item) => [item.categorySlug, item.category])).entries()].sort((a, b) => a[1].localeCompare(b[1], "pt-BR"));
  const languages = [...new Set(allItems.flatMap((item) => item.language ? [item.language] : []))].sort();
  const countries = [...new Set(allItems.flatMap((item) => item.country ? [item.country] : []))].sort();
  const minimumViews = safeOption(one(params.minimo), ["", "10000", "50000", "100000", "500000", "1000000"] as const, "");
  const filters: TrendingReelFilters = {
    period: safeOption(one(params.periodo), ["7", "30", "90", "all"] as const, "30"),
    category: safeOption(one(params.categoria), ["", ...categories.map(([slug]) => slug)], ""),
    language: safeOption(one(params.idioma), ["", ...languages], ""),
    country: safeOption(one(params.pais), ["", ...countries], ""),
    minimumViews: Number(minimumViews) || 0,
    sort: safeOption(one(params.ordenar), ["views", "engagement", "relative_performance", "recent"] as const, "views"),
  };
  const filtered = filterAndSortTrendingReels(allItems, filters, config.maxItems);
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const requestedPage = Math.max(1, Number.parseInt(one(params.pagina), 10) || 1);
  const currentPage = Math.min(requestedPage, totalPages);
  const items = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const hasFilters = Boolean(filters.category || filters.language || filters.country || filters.minimumViews || filters.period !== "30" || filters.sort !== "views");
  const jsonLd = [
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Início", item: siteConfig.url }, { "@type": "ListItem", position: 2, name: "Recursos", item: `${siteConfig.url}/recursos` }, { "@type": "ListItem", position: 3, name: "Reels em alta", item: `${siteConfig.url}${canonical}` }] },
    { "@context": "https://schema.org", "@type": "ItemList", name: "Amostra pública de Reels em destaque", numberOfItems: items.length, itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: (currentPage - 1) * pageSize + index + 1, url: item.permalink, name: `${item.author}: ${item.caption.slice(0, 80)}` })) },
  ];
  return <main className="reels-trending-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
    <EventTracker name="feature_viewed" properties={{ section_id: "resource_trending_reels" }} />
    <section className="reels-trending-hero"><Container><nav className="reels-trending-breadcrumb" aria-label="Navegação estrutural"><Link href="/">Início</Link><span>/</span><Link href="/recursos">Recursos</Link><span>/</span><strong>Reels em alta</strong></nav><div className="reels-trending-hero-grid"><div><span className="reels-trending-eyebrow">RADAR DE CONTEÚDO</span><h1>Reels em destaque, antes que a conversa passe.</h1><p>Explore uma amostra pública, periodicamente atualizada, de conteúdos que apresentam sinais de tendência. Métricas públicas podem mudar após a coleta.</p><div className="reels-trending-pills"><span>Amostra pública</span><span>Dados em cache</span><span>Filtros avançados</span></div></div><div className="reels-trending-visual" aria-hidden="true"><div><span>↗ 24h</span><strong>1,2 mi</strong><small>visualizações observadas</small></div><i>▶</i><b>TENDÊNCIA</b></div></div></Container></section>
    <section className="reels-trending-content"><Container>
      {!access.available ? <div className="reels-trending-state"><span>◌</span><h2>Recurso temporariamente indisponível</h2><p>Esta página de amostra pública foi pausada no painel administrativo. Volte em outro momento.</p></div> : access.locked ? <div className="reels-trending-state is-premium"><span>✦</span><small>PREMIUM PREVIEW</small><h2>Uma prévia do radar de tendências</h2><p>A amostra pública está visível como Premium Preview, mas a lista completa depende do acesso configurado.</p>{access.reason === "authentication_required" ? <Link className="button" href="/login">Entrar gratuitamente</Link> : <FeatureInterestButton featureKey="resource_trending_reels" source="resources_page" />}</div> : <>
        <form className="reels-trending-filters" method="get"><div className="reels-trending-filter-grid"><label>Período<select name="periodo" defaultValue={filters.period}><option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option><option value="all">Todo o snapshot</option></select></label><label>Categoria<select name="categoria" defaultValue={filters.category}><option value="">Todas</option>{categories.map(([slug, name]) => <option value={slug} key={slug}>{name}</option>)}</select></label><label>Idioma<select name="idioma" defaultValue={filters.language}><option value="">Todos</option>{languages.map((language) => <option value={language} key={language}>{language}</option>)}</select></label><label>País<select name="pais" defaultValue={filters.country}><option value="">Todos disponíveis</option>{countries.map((country) => <option value={country} key={country}>{country}</option>)}</select></label><label>Visualizações mínimas<select name="minimo" defaultValue={minimumViews}><option value="">Sem mínimo</option><option value="10000">10 mil</option><option value="50000">50 mil</option><option value="100000">100 mil</option><option value="500000">500 mil</option><option value="1000000">1 milhão</option></select></label><label>Ordenar por<select name="ordenar" defaultValue={filters.sort}>{Object.entries(sortLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><button type="submit">Aplicar filtros</button></div></form>
        <div className="reels-trending-heading"><div><span>AMOSTRA PÚBLICA · RESULTADOS EM CACHE</span><h2>{filtered.length ? `${filtered.length} Reels encontrados` : allItems.length ? "Nenhum Reel corresponde aos filtros" : "A amostra está sendo atualizada"}</h2></div>{hasFilters && <Link href={canonical}>Limpar filtros</Link>}</div>
        {items.length ? <div className="reels-trending-grid">{items.map((item) => <article className="reel-trending-card" key={`${item.id}:${item.permalink}`}><div className="reel-trending-media">{item.thumbnailUrl ? <img src={item.thumbnailUrl} alt={`Capa do Reel de ${item.author}`} loading="lazy" referrerPolicy="no-referrer" /> : <div className="reel-trending-placeholder"><span>▶</span><small>Thumbnail indisponível</small></div>}<span className="reel-trending-category">{item.category}</span><i aria-hidden="true">▶</i></div><div className="reel-trending-body"><header><strong>{item.author}</strong><time dateTime={item.publishedAt}>{dateFormat.format(new Date(item.publishedAt))}</time></header><p>{item.caption}</p><div className="reel-trending-primary"><div><span>Visualizações</span><b>{compactNumber.format(item.views)}</b></div><div><span>Engajamento</span><b>{percentFormat.format(item.engagementRate)}</b></div></div><dl><div><dt>Curtidas</dt><dd>{compactNumber.format(item.likes)}</dd></div><div><dt>Comentários</dt><dd>{compactNumber.format(item.comments)}</dd></div><div><dt>Áudio</dt><dd title={item.audio}>{item.audio}</dd></div><div><dt>Idioma · País</dt><dd>{[item.language, item.country].filter(Boolean).join(" · ") || "Não disponível"}</dd></div><div><dt>Desempenho proporcional</dt><dd>{item.relativePerformance === null ? "Não disponível" : `${item.relativePerformance.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}×`}</dd></div></dl><a className="reel-trending-link" href={item.permalink} target="_blank" rel="noopener noreferrer">Visualizar Reel <span aria-hidden="true">↗</span></a></div></article>)}</div> : <div className="reels-trending-state"><span>{allItems.length ? "⌕" : "◷"}</span><h3>{allItems.length ? "Sem resultados nesta combinação" : "Ainda não há uma amostra pública válida"}</h3><p>{allItems.length ? "Altere o período ou remova algum filtro para ampliar a amostra pública." : config.automaticRefresh ? "A atualização automática está ativa e publicará resultados após o próximo snapshot válido." : "A visita não inicia uma coleta externa. O administrador pode publicar um snapshot quando houver dados disponíveis."}</p>{allItems.length > 0 && <Link className="button button-secondary" href={canonical}>Ver toda a amostra</Link>}</div>}
        {filtered.length > pageSize && <nav className="reels-trending-pagination" aria-label="Paginação dos Reels"><Link aria-disabled={currentPage === 1} href={filtersHref(filters, Math.max(1, currentPage - 1))}>← Anterior</Link><span>Página <strong>{currentPage}</strong> de {totalPages}</span><Link aria-disabled={currentPage === totalPages} href={filtersHref(filters, Math.min(totalPages, currentPage + 1))}>Próxima →</Link></nav>}
        <div className="reels-trending-method"><strong>Sobre esta amostra pública</strong><p>Os resultados são uma amostra pública formada por snapshots válidos e não representam a totalidade do Instagram. Categoria, idioma e país podem ser estimados; desempenho proporcional só aparece quando existe base pública suficiente para o cálculo.</p><span>Cache: {config.cacheMinutes} minutos · limite: {config.maxItems} resultados · atualização automática: {config.automaticRefresh ? "ativa" : "inativa"}</span></div>
      </>}
    </Container></section>
  </main>;
}
