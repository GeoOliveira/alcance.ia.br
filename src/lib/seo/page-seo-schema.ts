import { z } from "zod";
import { pageKeys } from "@/lib/seo/page-catalog";

const optionalText = (maximum: number) => z.string().trim().max(maximum).transform((value) => value || null);
export const pageSeoFormSchema = z.object({
  pageKey: z.enum(pageKeys),
  metaTitle: optionalText(70),
  metaDescription: optionalText(180),
  metaKeywords: z.string().max(1000).transform((value) => [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))].slice(0, 20)),
  ogTitle: optionalText(90),
  ogDescription: optionalText(220),
  ogImageUrl: optionalText(2048).refine((value) => value === null || /^https:\/\//i.test(value), "Use uma URL HTTPS absoluta."),
  canonicalUrl: optionalText(2048).refine((value) => value === null || /^https:\/\//i.test(value), "Use uma URL HTTPS absoluta."),
  indexable: z.enum(["true", "false"]).transform((value) => value === "true"),
  followLinks: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export const seoImageSchema = z.object({
  name: z.string().max(180).regex(/^[a-zA-Z0-9._-]+$/),
  type: z.enum(["image/jpeg", "image/png", "image/webp"]),
  size: z.number().int().positive().max(2 * 1024 * 1024),
});
