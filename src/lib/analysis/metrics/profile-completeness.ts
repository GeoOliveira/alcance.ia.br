import type { InstagramProfile } from "@/lib/social-providers/contracts/instagram-profile";
import type { ProfileCompletenessResult } from "./types";
import { confidence } from "./common";

const criteria = [
  ["profile_image", "Foto de perfil", 15, (p: InstagramProfile) => Boolean(p.profileImageUrl)],
  ["display_name", "Nome de exibição", 10, (p: InstagramProfile) => Boolean(p.displayName?.trim())],
  ["biography", "Biografia", 20, (p: InstagramProfile) => Boolean(p.biography?.trim())],
  ["external_link", "Link externo", 15, (p: InstagramProfile) => Boolean(p.externalUrl)],
  ["professional_category", "Categoria profissional", 10, (p: InstagramProfile) => Boolean(p.category?.trim())],
  ["existing_posts", "Publicações existentes", 15, (p: InstagramProfile) => Boolean(p.postsCount && p.postsCount > 0)],
  ["additional_information", "Informações adicionais", 15, (p: InstagramProfile) => p.isBusiness !== null || p.isVerified !== null],
] as const;

export function calculateProfileCompleteness(profile: InstagramProfile): ProfileCompletenessResult {
  const completed = criteria.filter(([, , , check]) => check(profile));
  const score = completed.reduce((sum, [, , weight]) => sum + weight, 0);
  return { available: true, explanationCode: "fixed_weight_profile_fields", confidence: confidence(criteria.length, 5, 7), score,
    classification: score < 40 ? "incomplete" : score < 65 ? "basic" : score < 85 ? "well_filled" : "complete",
    completedCriteria: completed.map(([key]) => key), missingCriteria: criteria.filter((item) => !item[3](profile)).map(([key]) => key), availableCriteria: criteria.map(([key]) => key) };
}

export const profileCriterionLabels: Record<string, string> = Object.fromEntries(criteria.map(([key, label]) => [key, label]));
