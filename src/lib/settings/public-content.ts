import "server-only";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

export type PublicContent = Record<string, string>;
export type PublicFaq = { id: string; question: string; answer: string; position: number };

export const getHomeContent = unstable_cache(async (): Promise<PublicContent> => {
  const client = createAdminClient();
  if (!client) return {};
  const { data, error } = await client.from("site_content")
    .select("section,content_key,content_value").eq("locale", "pt-BR").eq("is_active", true);
  if (error || !data) return {};
  return Object.fromEntries(data.map((row) => [`${row.section}.${row.content_key}`, row.content_value]));
}, ["home-content-v1"], { tags: ["home-content"], revalidate: 300 });

export const getPublicFaqs = unstable_cache(async (): Promise<PublicFaq[]> => {
  const client = createAdminClient();
  if (!client) return [];
  const { data, error } = await client.from("site_faqs")
    .select("id,question,answer,position").eq("is_active", true).order("position", { ascending: true }).limit(100);
  return error || !data ? [] : data as PublicFaq[];
}, ["public-faqs-v1"], { tags: ["public-faqs"], revalidate: 300 });

export const getPublicFlags = unstable_cache(async (): Promise<Record<string, boolean>> => {
  const client = createAdminClient();
  if (!client) return {};
  const { data, error } = await client.from("feature_flags").select("key,enabled").eq("scope", "public");
  return error || !data ? {} : Object.fromEntries(data.map((row) => [row.key, row.enabled]));
}, ["public-flags-v1"], { tags: ["public-flags"], revalidate: 300 });
