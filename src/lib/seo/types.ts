import type { Metadata } from "next";

export type PageKey =
  | "home" | "about" | "how_it_works" | "resources" | "contact"
  | "privacy_policy" | "terms" | "cookies_policy" | "data_deletion"
  | "hashtags" | "trending_reels" | "category_reels" | "branded_content" | "whatsapp_link_generator" | "whatsapp_link_manager";

export type PageCatalogEntry = {
  key: PageKey;
  route: string;
  label: string;
  group: "Institucional" | "Legal" | "Recursos";
  defaults: Metadata;
};

export type PageSeoSettings = {
  id: string;
  page_key: PageKey;
  route: string;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string[];
  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;
  canonical_url: string | null;
  indexable: boolean;
  follow_links: boolean;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
};

export type PageSeoAIBrief = {
  page_key: PageKey;
  additional_guidance: string;
  updated_at: string;
  updated_by: string | null;
};
