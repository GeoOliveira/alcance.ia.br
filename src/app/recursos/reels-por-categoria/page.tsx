import type { Metadata } from "next";
import { CategoryReelsView, type CategoryReelsSearchParams } from "@/components/product-features/category-reels-view";
import { siteConfig } from "@/config/site";
import { getCategoryReelsConfig } from "@/lib/product-features/public-category-reels";
import { generatePageMetadata } from "@/lib/seo/generate-page-metadata";

const title = "Reels por categoria: encontre referências";
const description = "Explore uma amostra pública de Reels por Marketing, Negócios, Tecnologia, Finanças, Saúde, Moda e outras categorias.";
const canonical = "/recursos/reels-por-categoria";

export async function generateMetadata(): Promise<Metadata> {
  const config = await getCategoryReelsConfig();
  const index = config.enabled && config.flagEnabled && config.indexable && config.visibility !== "hidden";
  const metadata = await generatePageMetadata("category_reels", { title, description, alternates: { canonical }, openGraph: { type: "website", locale: "pt_BR", siteName: siteConfig.name, title, description, url: canonical } });
  const robots = metadata.robots && typeof metadata.robots === "object" ? metadata.robots : {};
  return { ...metadata, robots: { ...robots, index: index && robots.index !== false } };
}

export default function CategoryReelsPage({ searchParams }: { searchParams: Promise<CategoryReelsSearchParams> }) {
  return <CategoryReelsView searchParams={searchParams} />;
}
