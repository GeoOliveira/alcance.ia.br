import "server-only";
import { buildObservations, calculateAnalysisMetrics, selectTopPosts } from "./analysis-metrics";
import type { AnalysisViewModel } from "./types";
import type { InstagramPost } from "@/lib/social-providers/contracts/instagram-post";
import type { InstagramProfile } from "@/lib/social-providers/contracts/instagram-profile";
import { calculateAdvancedMetrics } from "./metrics";
import { defaultAdvancedAnalysisConfig, developmentAdvancedFeatureFlags } from "./advanced-config";
export const developmentDemoId = "00000000-0000-4000-8000-000000000001";
export function developmentDemoAnalysis(): AnalysisViewModel {
  const now = new Date(); const profile: InstagramProfile = { provider: "scrapecreators", providerUserId: "dev", username: "perfil.demonstracao", displayName: "Estúdio Horizonte", biography: "Design, conteúdo e ideias para marcas que querem comunicar melhor. Conheça nossos projetos ↓", profileImageUrl: null, externalUrl: "https://example.com", followersCount: 18400, followingCount: 642, postsCount: 186, isPrivate: false, isVerified: false, isBusiness: true, category: "Criador digital", rawDataAvailable: true, fetchedAt: now.toISOString() };
  const data = [["dev-1",1,1240,42,"video"],["dev-2",4,860,31,"carousel"],["dev-3",8,610,18,"image"],["dev-4",15,980,35,"video"],["dev-5",24,540,12,"carousel"]] as const;
  const posts: InstagramPost[] = data.map(([id, days, likes, comments, type]) => ({ providerPostId: id, shortcode: id, permalink: "https://www.instagram.com/", mediaType: type, caption: "Conteúdo demonstrativo para validar exclusivamente o layout em desenvolvimento.", publishedAt: new Date(now.getTime() - days * 86_400_000).toISOString(), likeCount: likes, commentCount: comments, viewCount: null, playCount: type === "video" ? likes * 12 : null, durationSeconds: null, thumbnailUrl: null, mediaUrl: null, isPinned: null, isCarousel: type === "carousel", carouselItemsCount: type === "carousel" ? 5 : null, hashtags: [], mentions: [], location: null, audio: null, rawDataAvailable: false }));
  const metrics = calculateAnalysisMetrics(profile, posts, now); return { requestId: developmentDemoId, state: "completed", stage: "complete", username: profile.username!, profileUrl: "https://www.instagram.com/", requestedAt: now.toISOString(), analyzedAt: now.toISOString(), profile, posts, metrics, observations: buildObservations(profile, posts, metrics), topPosts: selectTopPosts(posts), isCached: false, statusMessage: "Demonstração visual exclusiva do ambiente de desenvolvimento.", advancedMetrics: calculateAdvancedMetrics(profile, posts, defaultAdvancedAnalysisConfig, developmentAdvancedFeatureFlags, now) };
}
