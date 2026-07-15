import type { InstagramPost } from "@/lib/social-providers/contracts/instagram-post";
import { average, coefficientOfVariation, confidence, known, median, postInteractions, standardDeviation } from "./common";
import type { EngagementStabilityResult } from "./types";

export function calculateEngagementStability(posts: InstagramPost[]): EngagementStabilityResult {
  const values = known(posts.map((post) => postInteractions(post.likeCount, post.commentCount))); const minimum = 4;
  if (values.length < minimum) return { available: false, explanationCode: "minimum_four_interaction_values", confidence: confidence(values.length, minimum, 12, !values.length), classification: "insufficient", coefficientOfVariation: null, meanMedianRatio: null, range: null, outliersCount: 0, explanation: "Ainda não há publicações suficientes para avaliar estabilidade." };
  const mean = average(values)!, middle = median(values)!, deviation = standardDeviation(values) ?? 0, cv = coefficientOfVariation(values)!; const outliers = values.filter((value) => value > mean + deviation * 2).length;
  const classification = cv < 0.35 ? "stable" : cv < 0.75 ? "moderately_variable" : "highly_variable";
  return { available: true, explanationCode: "interaction_coefficient_of_variation", confidence: confidence(values.length, 4, 12), classification, coefficientOfVariation: cv, meanMedianRatio: middle > 0 ? mean / middle : null, range: Math.max(...values) - Math.min(...values), outliersCount: outliers,
    explanation: classification === "stable" ? "As interações ficaram relativamente próximas entre as publicações." : classification === "moderately_variable" ? "O desempenho variou de forma moderada entre os conteúdos." : "O desempenho varia bastante e parte do resultado pode estar concentrada em poucos conteúdos." };
}
