import type { Metadata } from "next";
import { CategoryReelsView, type CategoryReelsSearchParams } from "@/components/product-features/category-reels-view";
import { siteConfig } from "@/config/site";
import { getCategoryReelsConfig } from "@/lib/product-features/public-category-reels";

const title = "Reels por categoria: encontre referências";
const description = "Explore uma amostra pública de Reels por Marketing, Negócios, Tecnologia, Finanças, Saúde, Moda e outras categorias.";
const canonical = "/recursos/reels-por-categoria";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getCategoryReelsConfig();
  const index = config.enabled && config.flagEnabled && config.indexable && config.visibility !== "hidden";
  return { title, description, alternates: { canonical }, robots: { index, follow: true }, openGraph: { type: "website", locale: "pt_BR", siteName: siteConfig.name, title, description, url: canonical, images: [{ url: "/og.png", width: 1731, height: 909, alt: "Reels organizados por categoria" }] }, twitter: { card: "summary_large_image", title, description, images: ["/og.png"] } };
}

export default function CategoryReelsPage({ searchParams }: { searchParams: Promise<CategoryReelsSearchParams> }) {
  return <CategoryReelsView searchParams={searchParams} />;
}
