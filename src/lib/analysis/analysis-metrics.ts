import type { InstagramPost } from "@/lib/social-providers/contracts/instagram-post";
import type { InstagramProfile } from "@/lib/social-providers/contracts/instagram-profile";
import type { AnalysisMetrics, AnalysisObservation } from "./types";

const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
const median = (values: number[]) => { if (!values.length) return null; const sorted = [...values].sort((a, b) => a - b); const middle = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2; };
const known = (values: Array<number | null>) => values.filter((value): value is number => value !== null);
const formatLabel = (value: InstagramPost["mediaType"] | null) => value === "video" ? "Reels" : value === "carousel" ? "Carrosséis" : value === "image" ? "Imagens" : null;

export function calculateAnalysisMetrics(profile: InstagramProfile, posts: InstagramPost[], now = new Date()): AnalysisMetrics {
  const likes = known(posts.map((post) => post.likeCount)); const comments = known(posts.map((post) => post.commentCount));
  const reels = posts.filter((post) => post.mediaType === "video"), images = posts.filter((post) => post.mediaType === "image"), carousels = posts.filter((post) => post.mediaType === "carousel");
  const reelViews = known(reels.map((post) => post.playCount ?? post.viewCount)); const dates = posts.map((post) => post.publishedAt ? new Date(post.publishedAt) : null).filter((date): date is Date => Boolean(date && !Number.isNaN(date.getTime()))).sort((a, b) => b.getTime() - a.getTime());
  const ageDays = (date: Date) => (now.getTime() - date.getTime()) / 86_400_000; const intervals = dates.slice(0, -1).map((date, index) => Math.abs(date.getTime() - dates[index + 1]!.getTime()) / 86_400_000);
  const interactions = posts.map((post) => post.likeCount !== null || post.commentCount !== null ? (post.likeCount ?? 0) + (post.commentCount ?? 0) : null).filter((value): value is number => value !== null);
  const engagement = profile.followersCount && profile.followersCount > 0 && interactions.length ? average(interactions)! / profile.followersCount * 100 : null;
  const formats = [{ type: "video" as const, count: reels.length, values: reels }, { type: "image" as const, count: images.length, values: images }, { type: "carousel" as const, count: carousels.length, values: carousels }];
  const mostUsed = [...formats].sort((a, b) => b.count - a.count)[0]; const averages = formats.map((format) => ({ ...format, average: average(format.values.map((post) => (post.likeCount ?? 0) + (post.commentCount ?? 0))) })).filter((format) => format.average !== null && format.count > 0).sort((a, b) => b.average! - a.average!);
  const active30 = dates.filter((date) => ageDays(date) <= 30).length; const interval = average(intervals);
  return { averageLikes: average(likes), averageComments: average(comments), medianLikes: median(likes), medianComments: median(comments), estimatedEngagementRate: engagement,
    averageReelViews: average(reelViews), analyzedPosts: posts.length, reelsCount: reels.length, imagesCount: images.length, carouselsCount: carousels.length,
    postsLast7Days: dates.filter((date) => ageDays(date) <= 7).length, postsLast30Days: active30, averageIntervalDays: interval,
    followersFollowingRatio: profile.followersCount !== null && profile.followingCount && profile.followingCount > 0 ? profile.followersCount / profile.followingCount : null,
    mostUsedFormat: mostUsed?.count ? formatLabel(mostUsed.type) : null, bestObservedFormat: averages[0] ? formatLabel(averages[0].type) : null,
    engagementLabel: engagement === null ? "Dados insuficientes" : engagement < 1 ? "Baixo" : engagement < 3 ? "Moderado" : engagement < 6 ? "Bom" : "Alto",
    consistencyLabel: dates.length < 2 ? "Dados insuficientes" : active30 >= 12 || (interval !== null && interval <= 3) ? "Consistente" : active30 >= 4 || (interval !== null && interval <= 8) ? "Razoável" : "Irregular",
    contentLabel: posts.length < 3 ? "Dados insuficientes" : formats.filter((format) => format.count > 0).length >= 3 ? "Variado" : formats.filter((format) => format.count > 0).length === 2 ? "Equilibrado" : "Concentrado" };
}

export function buildObservations(profile: InstagramProfile, posts: InstagramPost[], metrics: AnalysisMetrics): AnalysisObservation[] {
  const observations: AnalysisObservation[] = [];
  if (posts.length < 3) observations.push({ id: "few-posts", title: "Amostra reduzida", message: "Há poucos conteúdos recentes disponíveis; as métricas devem ser interpretadas como parciais.", tone: "attention" });
  if (metrics.consistencyLabel === "Irregular") observations.push({ id: "frequency", title: "Frequência irregular", message: "Os intervalos observados entre publicações são longos ou pouco previsíveis.", tone: "attention" });
  if (metrics.bestObservedFormat && metrics.mostUsedFormat && metrics.bestObservedFormat !== metrics.mostUsedFormat) observations.push({ id: "format", title: `${metrics.bestObservedFormat} se destacam`, message: `Esse formato teve a maior média de interações na amostra, embora ${metrics.mostUsedFormat.toLowerCase()} sejam mais usados.`, tone: "positive" });
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
