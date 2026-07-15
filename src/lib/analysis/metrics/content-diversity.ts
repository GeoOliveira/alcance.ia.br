import type { InstagramPost } from "@/lib/social-providers/contracts/instagram-post";
import { confidence, percent } from "./common";
import { postFormat, type ContentDiversityResult, type ContentFormat } from "./types";

const formats: ContentFormat[] = ["reel", "image", "carousel", "unknown"];
export function calculateContentDiversity(posts: InstagramPost[]): ContentDiversityResult {
  const counts = Object.fromEntries(formats.map((format) => [format, posts.filter((post) => postFormat(post) === format).length])) as Record<ContentFormat, number>;
  const percentages = Object.fromEntries(formats.map((format) => [format, percent(counts[format], posts.length)])) as Record<ContentFormat, number | null>;
  const used = formats.filter((format) => counts[format] > 0); const predominant = [...used].sort((a, b) => counts[b] - counts[a])[0] ?? null;
  return { available: posts.length > 0, explanationCode: posts.length ? "normalized_media_types" : "no_posts", confidence: confidence(posts.length, 3, 10, !posts.length), counts, percentages, predominantFormat: predominant, formatsUsed: used.length,
    classification: posts.length < 3 ? "insufficient" : used.length <= 1 ? "concentrated" : used.length === 2 ? "moderately_diverse" : "diverse" };
}
