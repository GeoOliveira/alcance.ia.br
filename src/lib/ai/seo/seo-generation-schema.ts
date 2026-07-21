import { z } from "zod";
import { pageKeys } from "@/lib/seo/page-catalog";

const cleanText = (maximum: number) => z.string().trim().max(maximum);

export const SEO_GENERATION_SCHEMA_VERSION = "seo-generation-schema-v1";

export const seoGenerationOutputSchema = z.strictObject({
  metaTitle: z.string().min(20).max(70),
  metaDescription: z.string().min(60).max(180),
  metaKeywords: z.array(z.string().min(2).max(80)).min(3).max(20),
  openGraphTitle: z.string().min(10).max(90),
  openGraphDescription: z.string().min(40).max(220),
});

export const seoGenerationRequestSchema = z.strictObject({
  pageKey: z.enum(pageKeys),
  additionalGuidance: cleanText(2000),
  current: z.strictObject({
    metaTitle: cleanText(70),
    metaDescription: cleanText(180),
    metaKeywords: cleanText(1000),
    openGraphTitle: cleanText(90),
    openGraphDescription: cleanText(220),
  }),
  bypassCache: z.boolean().optional().default(false),
});

export type SeoGenerationOutput = z.infer<typeof seoGenerationOutputSchema>;
export type SeoGenerationRequest = z.infer<typeof seoGenerationRequestSchema>;

export function sanitizeSeoGenerationOutput(value: SeoGenerationOutput): SeoGenerationOutput {
  const plain = (text: string) => text.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  return {
    metaTitle: plain(value.metaTitle).slice(0, 70),
    metaDescription: plain(value.metaDescription).slice(0, 180),
    metaKeywords: [...new Set(value.metaKeywords.map(plain).filter(Boolean))].slice(0, 20),
    openGraphTitle: plain(value.openGraphTitle).slice(0, 90),
    openGraphDescription: plain(value.openGraphDescription).slice(0, 220),
  };
}
