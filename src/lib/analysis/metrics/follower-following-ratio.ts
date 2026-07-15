import type { InstagramProfile } from "@/lib/social-providers/contracts/instagram-profile";
import type { FollowerFollowingRatioResult } from "./types";
import { confidence } from "./common";

export function calculateFollowerFollowingRatio(profile: InstagramProfile): FollowerFollowingRatioResult {
  if (profile.followersCount === null || profile.followingCount === null) return { available: false, explanationCode: "missing_follower_counts", confidence: confidence(0, 1, 1, true), ratio: null, description: "A relação não pôde ser calculada com os dados disponíveis." };
  if (profile.followingCount === 0) return { available: false, explanationCode: "division_by_zero", confidence: confidence(0, 1, 1, true), ratio: null, description: "O perfil não segue contas públicas identificáveis; a divisão não é aplicável." };
  const ratio = profile.followersCount / profile.followingCount;
  const context = ratio < 1 ? "O perfil segue mais contas do que possui seguidores." : ratio < 10 ? "A quantidade de seguidores é superior à de perfis seguidos." : "A quantidade de seguidores é muitas vezes superior à de perfis seguidos.";
  return { available: true, explanationCode: "descriptive_ratio_only", confidence: confidence(2, 1, 2), ratio, description: `${context} Esta relação é descritiva e não determina, isoladamente, autoridade ou qualidade.` };
}
