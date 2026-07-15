import type { InstagramPost } from "@/lib/social-providers/contracts/instagram-post";
import { average, confidence, median, percent } from "./common";
import type { CaptionAnalysisResult } from "./types";

const emojiPattern = /\p{Extended_Pictographic}/u;
export function calculateCaptionAnalysis(posts: InstagramPost[]): CaptionAnalysisResult {
  const captions = posts.map((post) => post.caption?.trim() ?? ""); const present = captions.filter(Boolean); const lengths = present.map((caption) => caption.length); const hashtags = posts.map((post) => post.hashtags.length); const mentions = posts.map((post) => post.mentions.length); const typical = median(lengths);
  return { available: posts.length > 0, explanationCode: posts.length ? "normalized_caption_text" : "no_posts", confidence: confidence(posts.length, 4, 12, !posts.length), captionsCount: present.length, emptyCaptions: captions.length - present.length, averageLength: average(lengths), medianLength: typical, withParagraphsPercent: percent(present.filter((caption) => /\n\s*\n|\n/.test(caption)).length, present.length), withQuestionsPercent: percent(present.filter((caption) => caption.includes("?")).length, present.length), withEmojisPercent: percent(present.filter((caption) => emojiPattern.test(caption)).length, present.length), averageMentions: average(mentions), averageHashtags: average(hashtags), veryShortPercent: percent(lengths.filter((value) => value < 40).length, lengths.length), longPercent: percent(lengths.filter((value) => value > 220).length, lengths.length), typicalLength: typical === null ? "unavailable" : typical < 80 ? "short" : typical > 220 ? "long" : "medium" };
}
