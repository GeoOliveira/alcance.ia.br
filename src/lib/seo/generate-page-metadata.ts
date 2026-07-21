import type { Metadata } from "next";
import { siteConfig } from "@/config/site";
import { globalSeoDefaults } from "@/lib/seo/defaults";
import { getCatalogPage } from "@/lib/seo/page-catalog";
import { getPageSeo } from "@/lib/seo/get-page-seo";
import type { PageKey } from "@/lib/seo/types";

function titleValue(metadata: Metadata) {
  return typeof metadata.title === "string" ? metadata.title : globalSeoDefaults.title as string;
}

export async function generatePageMetadata(key: PageKey, override: Metadata = {}): Promise<Metadata> {
  const page = getCatalogPage(key);
  const defaults = { ...globalSeoDefaults, ...page.defaults, ...override };
  const seo = await getPageSeo(key);
  const title = seo?.meta_title || titleValue(defaults);
  const description = seo?.meta_description || (typeof defaults.description === "string" ? defaults.description : undefined) || (typeof globalSeoDefaults.description === "string" ? globalSeoDefaults.description : "Alcance IA");
  const ogTitle = seo?.og_title || title;
  const ogDescription = seo?.og_description || description;
  const image = seo?.og_image_url || "/og.png";
  return {
    ...defaults,
    title,
    description,
    keywords: seo?.meta_keywords?.length ? seo.meta_keywords : defaults.keywords,
    alternates: { canonical: seo?.canonical_url || page.route },
    robots: { index: seo?.indexable ?? true, follow: seo?.follow_links ?? true },
    openGraph: { ...globalSeoDefaults.openGraph, ...defaults.openGraph, title: ogTitle, description: ogDescription, url: seo?.canonical_url || page.route, images: [{ url: image, alt: String(ogTitle) }] },
    twitter: { ...globalSeoDefaults.twitter, title: ogTitle, description: ogDescription, images: [image] },
    metadataBase: new URL(siteConfig.url),
  };
}
