/* eslint-disable @next/next/no-img-element -- thumbnails externas são provenientes dos snapshots públicos. */
import Link from "next/link";
import { EventTracker } from "@/components/analytics/event-tracker";
import { FeatureInterestButton } from "@/components/product-features/feature-interest-button";
import { Container } from "@/components/ui/container";
import { createClient } from "@/lib/supabase/server";
import { decideCategoryReelsAccess, filterCategoryReels, getActiveReelCategories, getCachedCategoryReels, getCategoryReelsConfig, type CategoryReelFilters, type CategoryReelFormat } from "@/lib/product-features/public-category-reels";
import type { TrendingReelSort } from "@/lib/product-features/public-trending-reels";

export type CategoryReelsSearchParams = { busca?: string | string[]; periodo?: string | string[]; categoria?: string | string[]; idioma?: string | string[]; pais?: string | string[]; minimo?: string | string[]; formato?: string | string[]; ordenar?: string | string[]; pagina?: string | string[] };
const one = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] ?? "" : value ?? "";
const safeOption = <T extends string>(value: string, options: readonly T[], fallback: T) => options.includes(value as T) ? value as T : fallback;
const compactNumber = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });
const dateFormat = new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeZone: "America/Sao_Paulo" });
const percentFormat = new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 });
const formatLabels: Record<CategoryReelFormat, string> = { tutorial: "Tutorial", talking_head: "Falando para a câmera", vlog: "Vlog", review: "Review", entertainment: "Entretenimento", other: "Outro" };
const sortLabels: Record<TrendingReelSort, string> = { views: "Mais visualizados", engagement: "Mais engajados", relative_performance: "Melhor desempenho proporcional", recent: "Mais recentes" };

function hrefFor(filters: CategoryReelFilters, page: number, categorySlug?: string) {
  const base = categorySlug ? `/recursos/reels-por-categoria/${categorySlug}` : "/recursos/reels-por-categoria";
  const params = new URLSearchParams();
  if (filters.query) params.set("busca", filters.query);
  if (!categorySlug && filters.category) params.set("categoria", filters.category);
  if (filters.period && filters.period !== "30") params.set("periodo", filters.period);
  if (filters.language) params.set("idioma", filters.language);
  if (filters.country) params.set("pais", filters.country);
  if (filters.minimumViews) params.set("minimo", String(filters.minimumViews));
  if (filters.format) params.set("formato", filters.format);
  if (filters.sort && filters.sort !== "views") params.set("ordenar", filters.sort);
  if (page > 1) params.set("pagina", String(page));
  return params.size ? `${base}?${params}` : base;
}

export async function CategoryReelsView({ searchParams, forcedCategory }: { searchParams: Promise<CategoryReelsSearchParams>; forcedCategory?: string }) {
  const [params, config] = await Promise.all([searchParams, getCategoryReelsConfig()]);
  let isAuthenticated = false;
  try { const supabase = await createClient(); const { data } = await supabase.auth.getUser(); isAuthenticated = Boolean(data.user); } catch { /* acesso público sem sessão */ }
  const access = decideCategoryReelsAccess(config, { isAuthenticated });
  const categories = await getActiveReelCategories(config);
  const activeCategory = forcedCategory ? categories.find((category) => category.slug === forcedCategory) : undefined;
  const allItems = access.available && !access.locked ? await getCachedCategoryReels(config, categories) : [];
  const languages = [...new Set(categories.map((category) => category.language))].sort();
  const countries = [...new Set(categories.map((category) => category.country))].sort();
  const formats = [...new Set(allItems.map((item) => item.format))].sort();
  const minimumViews = safeOption(one(params.minimo), ["", "10000", "50000", "100000", "500000", "1000000"] as const, "");
  const category = forcedCategory ?? safeOption(one(params.categoria), ["", ...categories.map((item) => item.slug)], "");
  const filters: CategoryReelFilters = {
    query: one(params.busca).trim().slice(0, 100),
    period: safeOption(one(params.periodo), ["7", "30", "90", "all"] as const, "30"),
    category,
    language: safeOption(one(params.idioma), ["", ...languages], ""),
    country: safeOption(one(params.pais), ["", ...countries], ""),
    minimumViews: Number(minimumViews) || 0,
    format: safeOption(one(params.formato), ["", ...formats] as ("" | CategoryReelFormat)[], ""),
    sort: safeOption(one(params.ordenar), ["views", "engagement", "relative_performance", "recent"] as const, "views"),
  };
  const filtered = filterCategoryReels(allItems, filters, config.maxItems);
  const pageSize = 12;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(Math.max(1, Number.parseInt(one(params.pagina), 10) || 1), totalPages);
  const items = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const basePath = forcedCategory ? `/recursos/reels-por-categoria/${forcedCategory}` : "/recursos/reels-por-categoria";
  const hasFilters = Boolean(filters.query || (!forcedCategory && filters.category) || filters.language || filters.country || filters.minimumViews || filters.format || filters.period !== "30" || filters.sort !== "views");

  return <main className="reels-trending-page category-reels-page">
    <EventTracker name="feature_viewed" properties={{ section_id: "resource_reels_by_category" }} />
    <section className="reels-trending-hero category-reels-hero"><Container>
      <nav className="reels-trending-breadcrumb" aria-label="Navegação estrutural"><Link href="/">Início</Link><span>/</span><Link href="/recursos">Recursos</Link><span>/</span><strong>{activeCategory?.name ?? "Reels por categoria"}</strong></nav>
      <div className="reels-trending-hero-grid"><div><span className="reels-trending-eyebrow">BIBLIOTECA DE INSPIRAÇÃO</span><h1>{activeCategory ? `Reels de ${activeCategory.name} para explorar.` : "Encontre referências na categoria certa."}</h1><p>{activeCategory?.description ?? "Pesquise e compare uma amostra pública de Reels organizada em categorias administradas pela Alcance IA."}</p><div className="reels-trending-pills"><span>Amostra pública</span><span>Categorias curadas</span><span>Métricas comparáveis</span></div></div><div className="reels-trending-visual category-reels-visual" aria-hidden="true"><div><span>14 categorias</span><strong>#</strong><small>ideias para o próximo conteúdo</small></div><i>▶</i><b>EXPLORAR</b></div></div>
    </Container></section>
    <section className="reels-trending-content"><Container>
      {!access.available ? <div className="reels-trending-state"><span>○</span><h2>Recurso temporariamente indisponível</h2><p>A ferramenta foi pausada no painel administrativo.</p></div> : access.locked ? <div className="reels-trending-state is-premium"><span>✦</span><small>ACESSO CONTROLADO</small><h2>Explore referências por categoria</h2><p>O nível de acesso atual exige uma conta ou plano compatível.</p>{access.reason === "authentication_required" ? <Link className="button" href="/login">Entrar gratuitamente</Link> : <FeatureInterestButton featureKey="resource_reels_by_category" source="resources_page" />}</div> : <>
        <nav className="category-reels-categories" aria-label="Categorias de Reels"><Link className={!category ? "is-active" : ""} href="/recursos/reels-por-categoria">Todas</Link>{categories.map((item) => <Link className={category === item.slug ? "is-active" : ""} href={`/recursos/reels-por-categoria/${item.slug}`} key={item.id}>{item.name}</Link>)}</nav>
        <form className="reels-trending-filters category-reels-filters" method="get" action={basePath}>
          <label className="category-reels-search">Pesquisar Reels<div><span>⌕</span><input name="busca" defaultValue={filters.query} placeholder="Tema, legenda, autor, áudio ou hashtag" maxLength={100} /><button type="submit">Pesquisar</button></div></label>
          <div className="reels-trending-filter-grid"><label>Categoria<select name="categoria" defaultValue={category} disabled={Boolean(forcedCategory)}><option value="">Todas</option>{categories.map((item) => <option value={item.slug} key={item.id}>{item.name}</option>)}</select></label><label>Período<select name="periodo" defaultValue={filters.period}><option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option><option value="all">Todo o snapshot</option></select></label><label>Idioma<select name="idioma" defaultValue={filters.language}><option value="">Todos</option>{languages.map((language) => <option value={language} key={language}>{language}</option>)}</select></label><label>País<select name="pais" defaultValue={filters.country}><option value="">Todos</option>{countries.map((country) => <option value={country} key={country}>{country}</option>)}</select></label><label>Visualizações mínimas<select name="minimo" defaultValue={minimumViews}><option value="">Sem mínimo</option><option value="10000">10 mil</option><option value="50000">50 mil</option><option value="100000">100 mil</option><option value="500000">500 mil</option><option value="1000000">1 milhão</option></select></label><label>Formato<select name="formato" defaultValue={filters.format}><option value="">Todos</option>{formats.map((format) => <option value={format} key={format}>{formatLabels[format]}</option>)}</select></label><label>Ordenar por<select name="ordenar" defaultValue={filters.sort}>{Object.entries(sortLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label><button type="submit">Aplicar filtros</button></div>
        </form>
        <div className="reels-trending-heading"><div><span>RESULTADOS BASEADOS EM UMA AMOSTRA PÚBLICA DE CONTEÚDOS ENCONTRADOS</span><h2>{filtered.length ? `${filtered.length} Reels encontrados` : allItems.length ? "Nenhum Reel corresponde aos filtros" : "A amostra está sendo atualizada"}</h2></div>{hasFilters && <Link href={basePath}>Limpar filtros</Link>}</div>
        {items.length ? <div className="reels-trending-grid">{items.map((item) => <article className="reel-trending-card" key={`${item.id}:${item.permalink}`}><div className="reel-trending-media">{item.thumbnailUrl ? <img src={item.thumbnailUrl} alt={`Capa do Reel de ${item.author}`} loading="lazy" referrerPolicy="no-referrer" /> : <div className="reel-trending-placeholder"><span>▶</span><small>Thumbnail indisponível</small></div>}<span className="reel-trending-category">{item.category}</span><i aria-hidden="true">▶</i></div><div className="reel-trending-body"><header><strong>{item.author}</strong><time dateTime={item.publishedAt}>{dateFormat.format(new Date(item.publishedAt))}</time></header><p>{item.caption}</p><div className="reel-trending-primary"><div><span>Visualizações</span><b>{compactNumber.format(item.views)}</b></div><div><span>Engajamento</span><b>{percentFormat.format(item.engagementRate)}</b></div></div><dl><div><dt>Curtidas</dt><dd>{compactNumber.format(item.likes)}</dd></div><div><dt>Comentários</dt><dd>{compactNumber.format(item.comments)}</dd></div><div><dt>Áudio</dt><dd title={item.audio}>{item.audio}</dd></div><div><dt>Formato</dt><dd>{formatLabels[item.format]}</dd></div><div><dt>Desempenho proporcional</dt><dd>{item.relativePerformance === null ? "Não disponível" : `${item.relativePerformance.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}×`}</dd></div></dl>{item.hashtags.length > 0 && <div className="category-reel-tags" aria-label="Hashtags principais">{item.hashtags.map((tag) => <span key={tag}>{tag}</span>)}</div>}<a className="reel-trending-link" href={item.permalink} target="_blank" rel="noopener noreferrer">Visualizar Reel <span aria-hidden="true">↗</span></a></div></article>)}</div> : <div className="reels-trending-state"><span>{allItems.length ? "⌕" : "▷"}</span><h3>{allItems.length ? "Sem resultados nesta combinação" : "Ainda não há uma amostra pública válida"}</h3><p>{allItems.length ? "Amplie o período ou remova algum filtro." : "A visita não inicia coleta externa. Os resultados aparecem após a publicação de snapshots válidos pelo processo administrado."}</p></div>}
        {filtered.length > pageSize && <nav className="reels-trending-pagination" aria-label="Paginação dos Reels"><Link aria-disabled={currentPage === 1} href={hrefFor(filters, Math.max(1, currentPage - 1), forcedCategory)}>← Anterior</Link><span>Página <strong>{currentPage}</strong> de {totalPages}</span><Link aria-disabled={currentPage === totalPages} href={hrefFor(filters, Math.min(totalPages, currentPage + 1), forcedCategory)}>Próxima →</Link></nav>}
        <div className="reels-trending-method"><strong>Sobre os resultados</strong><p>Resultados baseados em uma amostra pública de conteúdos encontrados. Eles não representam todos os conteúdos do Instagram. Métricas podem mudar depois da coleta; categoria, formato, idioma e país podem ser estimados.</p><span>Cache: {config.cacheMinutes} minutos · limite: {config.maxItems} resultados · atualização automática: {config.automaticRefresh ? "ativa" : "inativa"}</span></div>
      </>}
    </Container></section>
  </main>;
}
