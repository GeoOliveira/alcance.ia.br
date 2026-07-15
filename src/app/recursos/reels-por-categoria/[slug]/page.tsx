import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryReelsView, type CategoryReelsSearchParams } from "@/components/product-features/category-reels-view";
import { siteConfig } from "@/config/site";
import { getActiveReelCategories, getCategoryReelsConfig } from "@/lib/product-features/public-category-reels";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const [{ slug }, config] = await Promise.all([params, getCategoryReelsConfig()]);
  const category = (await getActiveReelCategories(config)).find((item) => item.slug === slug);
  if (!category) return { title: "Categoria indisponível", robots: { index: false, follow: true } };
  const title = `Reels de ${category.name}: referências e métricas`;
  const description = category.description || `Explore uma amostra pública de Reels de ${category.name}.`;
  const canonical = `/recursos/reels-por-categoria/${category.slug}`;
  const index = config.enabled && config.flagEnabled && config.indexable && config.visibility !== "hidden";
  return { title, description, alternates: { canonical }, robots: { index, follow: true }, openGraph: { type: "website", locale: "pt_BR", siteName: siteConfig.name, title, description, url: canonical, images: [{ url: "/og.png", width: 1731, height: 909, alt: `Reels de ${category.name}` }] } };
}

export default async function CategoryReelsBySlugPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<CategoryReelsSearchParams> }) {
  const [{ slug }, config] = await Promise.all([params, getCategoryReelsConfig()]);
  const exists = (await getActiveReelCategories(config)).some((item) => item.slug === slug);
  if (!exists) notFound();
  return <CategoryReelsView searchParams={searchParams} forcedCategory={slug} />;
}
