export const productFeatureKeys = [
  "profile_hashtag_analysis",
  "profile_top_hashtags",
  "profile_top_reels",
  "profile_reels_by_views",
  "profile_reels_by_engagement",
  "profile_reels_relative_performance",
  "profile_audio_analysis",
  "resource_hashtags",
  "resource_trending_reels",
  "resource_reels_by_category",
  "category_hashtag_discovery",
  "category_reels_discovery",
  "category_reels_by_views",
  "category_reels_by_engagement",
  "category_reels_relative_performance",
  "trending_reels",
  "trending_reels_categorization",
  "reels_audio_discovery",
] as const;

export type ProductFeatureKey = (typeof productFeatureKeys)[number];
export type ProductFeatureAudience = "public" | "free" | "premium" | "admin";
export type ProductFeatureStatus = "development" | "beta" | "active" | "disabled" | "inactive";
export type ProductFeatureVisibility = "hidden" | "preview" | "full";
export type ProductFeatureGroup = "profile" | "category" | "trending" | "audio";

export type ProductFeatureDefinition = {
  key: ProductFeatureKey;
  name: string;
  description: string;
  group: ProductFeatureGroup;
  defaultAudience: ProductFeatureAudience;
  defaultStatus: ProductFeatureStatus;
  defaultVisibility: ProductFeatureVisibility;
  defaultEnabled: boolean;
  requiresProviderCall: boolean;
  provider: "scrapecreators" | "internal";
  dependencies: readonly ProductFeatureKey[];
  estimatedCreditCost: number;
  defaultLimits: Record<string, number>;
};

const profile = { group: "profile", defaultAudience: "public", defaultStatus: "active", defaultVisibility: "full", defaultEnabled: true, requiresProviderCall: false, provider: "internal", dependencies: [], estimatedCreditCost: 0, defaultLimits: { maxItems: 5 } } as const;
const discovery = { group: "category", defaultAudience: "premium", defaultStatus: "beta", defaultVisibility: "preview", defaultEnabled: false, requiresProviderCall: true, provider: "scrapecreators", dependencies: [], estimatedCreditCost: 1, defaultLimits: { dailyRequests: 10, maxItems: 20, cacheMinutes: 360 } } as const;
const trending = { group: "trending", defaultAudience: "premium", defaultStatus: "beta", defaultVisibility: "preview", defaultEnabled: false, requiresProviderCall: true, provider: "scrapecreators", dependencies: [], estimatedCreditCost: 1, defaultLimits: { dailyRequests: 5, maxItems: 20, cacheMinutes: 360 } } as const;

export const productFeatureCatalog: readonly ProductFeatureDefinition[] = [
  { ...profile, key: "profile_hashtag_analysis", name: "Análise de hashtags do perfil", description: "Métricas descritivas calculadas a partir das legendas já armazenadas." },
  { ...profile, key: "profile_top_hashtags", name: "Hashtags mais usadas", description: "Ranking de frequência e desempenho descritivo das hashtags observadas no perfil.", defaultLimits: { maxItems: 8, minimumPostsPerHashtag: 2 } },
  { ...profile, key: "profile_top_reels", name: "Reels em destaque", description: "Área com rankings independentes dos Reels coletados." },
  { ...profile, key: "profile_reels_by_views", name: "Reels por visualizações", description: "Ordenação por plays ou visualizações públicas disponíveis." },
  { ...profile, key: "profile_reels_by_engagement", name: "Reels por engajamento", description: "Ordenação pela razão entre interações e visualizações." },
  { ...profile, key: "profile_reels_relative_performance", name: "Reels por desempenho proporcional", description: "Ordenação pela razão entre visualizações e seguidores atuais." },
  { ...profile, key: "profile_audio_analysis", name: "Resumo de áudios", description: "Resume os áudios que já vieram nos dados normalizados.", group: "audio", defaultStatus: "beta", defaultEnabled: false },
  { ...profile, key: "resource_hashtags", name: "Descoberta pública de hashtags", description: "Ferramenta pública baseada exclusivamente em snapshots válidos de hashtags por categoria.", group: "category", defaultLimits: { maxItems: 60, dailyRequests: 0, cacheMinutes: 360 } },
  { ...trending, key: "resource_trending_reels", name: "Reels em alta — página pública", description: "Lista periodicamente atualizada baseada exclusivamente em uma amostra pública persistida.", defaultAudience: "public", defaultStatus: "active", defaultVisibility: "full", defaultEnabled: true, requiresProviderCall: false, provider: "internal", estimatedCreditCost: 0, defaultLimits: { maxItems: 48, dailyRequests: 0, cacheMinutes: 180 } },
  { ...discovery, key: "resource_reels_by_category", name: "Reels por categoria — página pública", description: "Exploração pública de Reels organizados pelas categorias e snapshots administrados.", defaultAudience: "public", defaultStatus: "active", defaultVisibility: "full", defaultEnabled: true, requiresProviderCall: false, provider: "internal", estimatedCreditCost: 0, defaultLimits: { maxItems: 60, dailyRequests: 0, cacheMinutes: 180 } },
  { ...discovery, key: "category_hashtag_discovery", name: "Hashtags por categoria", description: "Descoberta de hashtags em snapshots de categorias aprovadas." },
  { ...discovery, key: "category_reels_discovery", name: "Reels por categoria", description: "Descoberta de Reels em snapshots de categorias aprovadas." },
  { ...discovery, key: "category_reels_by_views", name: "Reels da categoria por views", description: "Ranking por visualizações dentro de uma categoria." },
  { ...discovery, key: "category_reels_by_engagement", name: "Reels da categoria por engajamento", description: "Ranking por engajamento dentro de uma categoria." },
  { ...discovery, key: "category_reels_relative_performance", name: "Reels da categoria por desempenho proporcional", description: "Ranking proporcional dentro de uma categoria." },
  { ...trending, key: "trending_reels", name: "Reels em alta", description: "Snapshots controlados de conteúdos em tendência." },
  { ...trending, key: "trending_reels_categorization", name: "Categorias de Reels em alta", description: "Classificação controlada dos snapshots em tendência.", requiresProviderCall: false, provider: "internal", estimatedCreditCost: 0 },
  { ...trending, key: "reels_audio_discovery", name: "Descoberta de áudios", description: "Áudios observados nos snapshots de Reels.", group: "audio" },
] as const;

export const productFeatureKeySet = new Set<string>(productFeatureKeys);

export function isProductFeatureKey(value: string): value is ProductFeatureKey {
  return productFeatureKeySet.has(value);
}

export function getProductFeatureDefinition(key: ProductFeatureKey) {
  return productFeatureCatalog.find((feature) => feature.key === key)!;
}
