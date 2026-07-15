import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type ContentCategory = { id: string; slug: string; name: string; description: string; keywords: string[]; position: number };
export type DiscoverySnapshot = { items?: Array<Record<string, unknown>>; summary?: string; methodology?: string };

export async function listActiveContentCategories(): Promise<ContentCategory[]> {
  const admin = createAdminClient();
  if (!admin) return [];
  const { data, error } = await admin.from("content_categories").select("id,slug,name,description,keywords,position").eq("enabled", true).eq("visible", true).order("position").order("name");
  return error ? [] : (data || []) as ContentCategory[];
}

export async function getActiveContentCategory(slug: string): Promise<ContentCategory | null> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null;
  const admin = createAdminClient();
  if (!admin) return null;
  const { data, error } = await admin.from("content_categories").select("id,slug,name,description,keywords,position").eq("slug", slug).eq("enabled", true).eq("visible", true).maybeSingle();
  return error ? null : data as ContentCategory | null;
}

export async function getCategorySnapshot(categoryId: string, resultType: "hashtags" | "reels" | "audio", ranking = "relevance") {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data, error } = await admin.from("category_discovery_results").select("snapshot,item_count,fetched_at,expires_at").eq("category_id", categoryId).eq("result_type", resultType).eq("ranking", ranking).gt("expires_at", new Date().toISOString()).order("fetched_at", { ascending: false }).limit(1).maybeSingle();
  return error ? null : data as { snapshot: DiscoverySnapshot; item_count: number; fetched_at: string; expires_at: string } | null;
}

export async function getTrendingSnapshot(resultType: "reels" | "categories" | "audio") {
  const admin = createAdminClient();
  if (!admin) return null;
  const { data, error } = await admin.from("trending_discovery_results").select("snapshot,item_count,fetched_at,expires_at").eq("result_type", resultType).gt("expires_at", new Date().toISOString()).order("fetched_at", { ascending: false }).limit(1).maybeSingle();
  return error ? null : data as { snapshot: DiscoverySnapshot; item_count: number; fetched_at: string; expires_at: string } | null;
}
