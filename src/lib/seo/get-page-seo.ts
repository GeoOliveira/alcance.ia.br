import "server-only";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PageKey, PageSeoSettings } from "@/lib/seo/types";

const getSeoRows = unstable_cache(async (): Promise<PageSeoSettings[]> => {
  const client = createAdminClient();
  if (!client) return [];
  const { data, error } = await client.from("page_seo_settings").select("id,page_key,route,meta_title,meta_description,meta_keywords,og_title,og_description,og_image_url,canonical_url,indexable,follow_links,created_at,updated_at,updated_by");
  return error || !data ? [] : data as PageSeoSettings[];
}, ["page-seo-settings-v1"], { tags: ["page-seo"], revalidate: 300 });

export async function getPageSeo(key: PageKey) {
  try { return (await getSeoRows()).find((row) => row.page_key === key) ?? null; }
  catch { return null; }
}
