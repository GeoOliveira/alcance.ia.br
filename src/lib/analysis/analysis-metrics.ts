import type { InstagramPost } from "@/lib/social-providers/contracts/instagram-post";
import type { InstagramProfile } from "@/lib/social-providers/contracts/instagram-profile";
import { classifyEngagement, DEFAULT_ENGAGEMENT_CONFIG, engagementConfidence, ENGAGEMENT_FORMULA_VERSION, selectEngagementPosts, type EngagementConfig } from "./engagement";
import type { AnalysisMetrics, AnalysisObservation } from "./types";

const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
const median = (values: number[]) => { if (!values.length) return null; const sorted = [...values].sort((a, b) => a - b); const middle = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2; };
const known = (values: Array<number | null>) => values.filter((value): value is number => value !== null);
const formatLabel = (value: InstagramPost["mediaType"] | null) => value === "video" ? "Reels" : value === "carousel" ? "Carrosséis" : value === "image" ? "Imagens" : null;

export function calculateAnalysisMetrics(profile: InstagramProfile, posts: InstagramPost[], now = new Date(), engagementConfig: EngagementConfig = DEFAULT_ENGAGEMENT_CONFIG): AnalysisMetrics {
  const startedAt = performance.now();
  const likes = known(posts.map((post) => post.likeCount)); const comments = known(posts.map((post) => post.commentCount));
  const reels = posts.filter((post) => post.mediaType === "video"), images = posts.filter((post) => post.mediaType === "image"), carousels = posts.filter((post) => post.mediaType === "carousel");
  const reelViews = known(reels.map((post) => post.playCount ?? post.viewCount)); const dates = posts.map((post) => post.publishedAt ? new Date(post.publishedAt) : null).filter((date): date is Date => Boolean(date && !Number.isNaN(date.getTime()))).sort((a, b) => b.getTime() - a.getTime());
  const ageDays = (date: Date) => (now.getTime() - date.getTime()) / 86_400_000; const intervals = dates.slice(0, -1).map((date, index) => Math.abs(date.getTime() - dates[index + 1]!.getTime()) / 86_400_000);
  const selection = selectEngagementPosts(posts, now, engagementConfig); const interactions = selection.validPosts.map((post) => post.likeCount! + post.commentCount!);
  const averageInteractions = average(interactions); const medianInteractions = median(interactions); const followers = profile.followersCount !== null && profile.followersCount > 0 ? profile.followersCount : null;
  const engagement = followers !== null && averageInteractions !== null ? averageInteractions / followers * 100 : null; const typicalEngagement = followers !== null && medianInteractions !== null ? medianInteractions / followers * 100 : null;
  const totalInteractions = interactions.reduce((sum, value) => sum + value, 0); const descendingInteractions = [...interactions].sort((a, b) => b - a);
  const formats = [{ type: "video" as const, count: reels.length, values: reels }, { type: "image" as const, count: images.length, values: images }, { type: "carousel" as const, count: carousels.length, values: carousels }];
  const mostUsed = [...formats].sort((a, b) => b.count - a.count)[0]; const averages = formats.map((format) => ({ ...format, average: average(format.values.flatMap((post) => post.likeCount !== null && post.commentCount !== null ? [post.likeCount + post.commentCount] : [])) })).filter((format) => format.average !== null && format.count > 0).sort((a, b) => b.average! - a.average!);
  const active30 = dates.filter((date) => ageDays(date) <= 30 && ageDays(date) >= 0).length; const interval = average(intervals); const confidence = engagementConfidence(interactions.length, engagementConfig.minimumPosts);
  const result: AnalysisMetrics = {
    averageLikes: average(likes), averageComments: average(comments), medianLikes: median(likes), medianComments: median(comments), averageInteractions, medianInteractions,
    estimatedEngagementRate: engagement, estimatedTypicalEngagementRate: typicalEngagement, averageReelViews: average(reelViews), analyzedPosts: posts.length, validEngagementPosts: interactions.length,
    reelsCount: reels.length, imagesCount: images.length, carouselsCount: carousels.length, postsLast7Days: dates.filter((date) => ageDays(date) <= 7 && ageDays(date) >= 0).length, postsLast30Days: active30, averageIntervalDays: interval,
    followersFollowingRatio: profile.followersCount !== null && profile.followingCount !== null && profile.followingCount > 0 ? profile.followersCount / profile.followingCount : null,
    mostUsedFormat: mostUsed?.count ? formatLabel(mostUsed.type) : null, bestObservedFormat: averages[0] ? formatLabel(averages[0].type) : null,
    engagementLabel: classifyEngagement(engagement, interactions.length, engagementConfig.minimumPosts), engagementConfidence: confidence,
    engagementFormulaVersion: ENGAGEMENT_FORMULA_VERSION, engagementCalculatedAt: now.toISOString(), followersCountUsed: followers, engagementMaxPosts: engagementConfig.maxPosts, engagementMaxAgeDays: engagementConfig.maxAgeDays, engagementExclusions: selection.exclusions,
    minimumInteractions: interactions.length ? Math.min(...interactions) : null, maximumInteractions: interactions.length ? Math.max(...interactions) : null,
    meanMedianRatio: averageInteractions !== null && medianInteractions !== null && medianInteractions > 0 ? averageInteractions / medianInteractions : null,
    topPostShare: totalInteractions > 0 ? descendingInteractions[0]! / totalInteractions * 100 : null, topThreeShare: totalInteractions > 0 ? descendingInteractions.slice(0, 3).reduce((sum, value) => sum + value, 0) / totalInteractions * 100 : null,
    consistencyLabel: dates.length < 2 ? "Dados insuficientes" : active30 >= 12 || (interval !== null && interval <= 3) ? "Consistente" : active30 >= 4 || (interval !== null && interval <= 8) ? "Razoável" : "Irregular",
    contentLabel: posts.length < 3 ? "Dados insuficientes" : formats.filter((format) => format.count > 0).length >= 3 ? "Variado" : formats.filter((format) => format.count > 0).length === 2 ? "Equilibrado" : "Concentrado",
  };
  console.info("engagement_metric_calculated", { formulaVersion: ENGAGEMENT_FORMULA_VERSION, durationMs: Math.round((performance.now() - startedAt) * 100) / 100, validPosts: interactions.length, discardedPosts: Object.values(selection.exclusions).reduce((sum, count) => sum + count, 0), discardReasons: selection.exclusions, confidence });
  return result;
}

export function buildObservations(profile: InstagramProfile, posts: InstagramPost[], metrics: AnalysisMetrics): AnalysisObservation[] {
  const observations: AnalysisObservation[] = [];
  if (metrics.validEngagementPosts < 3) observations.push({ id: "few-posts", title: "Amostra reduzida", message: "Há menos de três publicações com data, curtidas e comentários observados; o engajamento não recebe classificação.", tone: "attention" });
  if (metrics.consistencyLabel === "Irregular") observations.push({ id: "frequency", title: "Frequência irregular", message: "Os intervalos observados entre publicações são longos ou pouco previsíveis.", tone: "attention" });
  if (metrics.bestObservedFormat && metrics.mostUsedFormat && metrics.bestObservedFormat !== metrics.mostUsedFormat) observations.push({ id: "format", title: `${metrics.bestObservedFormat} se destacam`, message: `Esse formato teve a maior média de interações completas na amostra, embora ${metrics.mostUsedFormat.toLowerCase()} sejam mais usados.`, tone: "positive" });
  if (!profile.biography?.trim()) observations.push({ id: "bio-empty", title: "Bio ausente", message: "O perfil público não apresentou uma biografia disponível no momento da coleta.", tone: "attention" });
  else if (!profile.externalUrl && !/(saiba|clique|acesse|link|fale|confira|compre|agende)/i.test(profile.biography)) observations.push({ id: "bio-cta", title: "Próximo passo pouco explícito", message: "A bio não apresentou link nem uma chamada objetiva identificável por regras simples.", tone: "neutral" });
  if (metrics.averageComments !== null && metrics.averageLikes !== null && metrics.averageLikes > 0 && metrics.averageComments / metrics.averageLikes < 0.01) observations.push({ id: "comments", title: "Poucos comentários na amostra", message: "A média de comentários ficou baixa em relação à média de curtidas observada.", tone: "neutral" });
  if (!observations.length) observations.push({ id: "balanced", title: "Sinais estáveis", message: "A amostra não apresentou alertas determinísticos relevantes. Novos conteúdos podem tornar a leitura mais precisa.", tone: "positive" });
  return observations.slice(0, 4);
}

export function selectTopPosts(posts: InstagramPost[], limit = 3) {
  return [...posts].filter((post) => post.likeCount !== null || post.commentCount !== null || post.playCount !== null || post.viewCount !== null)
    .sort((a, b) => ((b.likeCount ?? 0) + (b.commentCount ?? 0) * 2) - ((a.likeCount ?? 0) + (a.commentCount ?? 0) * 2) || ((b.playCount ?? b.viewCount ?? 0) - (a.playCount ?? a.viewCount ?? 0))).slice(0, limit);
}
