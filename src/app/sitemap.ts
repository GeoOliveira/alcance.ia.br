import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
import { getHashtagResourceConfig } from "@/lib/product-features/public-hashtags";
import { getTrendingReelsResourceConfig } from "@/lib/product-features/public-trending-reels";
import { getActiveReelCategories, getCategoryReelsConfig } from "@/lib/product-features/public-category-reels";

const paths = ["", "/como-funciona", "/recursos", "/quem-somos", "/contato", "/politica-de-privacidade", "/termos-de-uso", "/politica-de-cookies", "/exclusao-de-dados"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [config, reelsConfig, categoryReelsConfig] = await Promise.all([getHashtagResourceConfig(), getTrendingReelsResourceConfig(), getCategoryReelsConfig()]);
  const publicPaths = [...paths];
  if (config.enabled && config.flagEnabled && config.indexable && config.visibility !== "hidden") publicPaths.push("/recursos/hashtags");
  if (reelsConfig.enabled && reelsConfig.flagEnabled && reelsConfig.indexable && reelsConfig.visibility !== "hidden") publicPaths.push("/recursos/reels-em-alta");
  if (categoryReelsConfig.enabled && categoryReelsConfig.flagEnabled && categoryReelsConfig.indexable && categoryReelsConfig.visibility !== "hidden") {
    publicPaths.push("/recursos/reels-por-categoria");
    const activeCategories = await getActiveReelCategories(categoryReelsConfig);
    publicPaths.push(...activeCategories.map((category) => `/recursos/reels-por-categoria/${category.slug}`));
  }
  return publicPaths.map((path) => ({
    url: `${siteConfig.url}${path}`,
    lastModified: new Date("2026-07-15"),
    changeFrequency: path === "" || path === "/recursos/hashtags" || path === "/recursos/reels-em-alta" || path.startsWith("/recursos/reels-por-categoria") ? "weekly" : "monthly",
    priority: path === "" ? 1 : path.startsWith("/recursos/") ? 0.85 : 0.7,
  }));
}
