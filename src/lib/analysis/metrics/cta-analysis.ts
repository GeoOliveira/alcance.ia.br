import type { InstagramPost } from "@/lib/social-providers/contracts/instagram-post";
import { confidence, percent } from "./common";
import type { CtaAnalysisResult, CtaCategory } from "./types";

export const ctaPatterns: Array<{ label: string; category: CtaCategory; pattern: RegExp }> = [
  { label: "comente", category: "interaction", pattern: /\bcoment(?:e|a|em)\b/iu }, { label: "marque", category: "interaction", pattern: /\bmarqu(?:e|em)\b/iu },
  { label: "compartilhe", category: "sharing", pattern: /\bcompartilh(?:e|em)\b/iu }, { label: "envie", category: "sharing", pattern: /\benvi(?:e|em)\s+(?:para|a)\b/iu },
  { label: "salve", category: "saving", pattern: /\bsalv(?:e|em)\s+(?:(?:este|esse|esta|essa|o|a)\s+)?(?:post|conteúdo|publicação)\b/iu },
  { label: "clique", category: "click", pattern: /\bcliqu(?:e|em)\b/iu }, { label: "acesse", category: "click", pattern: /\bacesse\b/iu }, { label: "confira", category: "click", pattern: /\bconfira\b/iu }, { label: "link na bio", category: "click", pattern: /\blink\s+(?:na|da)\s+bio\b/iu },
  { label: "fale conosco", category: "contact", pattern: /\bfale\s+(?:com|conosco)\b/iu }, { label: "direct", category: "contact", pattern: /\b(?:chame|fale|mande)\s+(?:no|pelo)\s+direct\b/iu },
  { label: "siga", category: "following", pattern: /\bsig(?:a|am)\s+(?:o|a|este|esta|nosso|nossa)?\b/iu },
];

export function calculateCtaAnalysis(posts: InstagramPost[]): CtaAnalysisResult {
  const matches = posts.map((post) => ctaPatterns.filter((item) => item.pattern.test(post.caption ?? ""))); const present = matches.filter((items) => items.length > 0); const labels = new Map<string, number>(), categories = new Map<CtaCategory, number>();
  for (const items of matches) for (const item of items) { labels.set(item.label, (labels.get(item.label) ?? 0) + 1); categories.set(item.category, (categories.get(item.category) ?? 0) + 1); }
  return { available: posts.length > 0, explanationCode: posts.length ? "conservative_portuguese_patterns" : "no_posts", confidence: confidence(posts.length, 4, 12, !posts.length), postsWithCta: present.length, postsWithoutCta: posts.length - present.length, percentageWithCta: percent(present.length, posts.length), mostFrequent: [...labels.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([label]) => label), categories: [...categories.entries()].map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count) };
}
