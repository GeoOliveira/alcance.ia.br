import type { InstagramPost } from "@/lib/social-providers/contracts/instagram-post";

function normalizedPermalink(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    const match = url.pathname.match(/^\/(?:p|reel|tv)\/([^/]+)/i);
    return match?.[1]?.toLowerCase() ?? `${url.hostname.toLowerCase()}${url.pathname.replace(/\/+$/, "").toLowerCase()}`;
  } catch { return value.trim().replace(/[?#].*$/, "").replace(/\/+$/, "").toLowerCase() || null; }
}

function aliases(post: InstagramPost) {
  const permalink = normalizedPermalink(post.permalink);
  return [
    post.providerPostId ? `id:${post.providerPostId}` : null,
    post.shortcode ? `code:${post.shortcode.toLowerCase()}` : null,
    permalink ? `${permalink.includes("/") ? "link" : "code"}:${permalink}` : null,
  ].filter((value): value is string => value !== null);
}

function mergePost(current: InstagramPost, incoming: InstagramPost): InstagramPost {
  const preferred = current.mediaType === "unknown" && incoming.mediaType !== "unknown" ? incoming : current;
  const secondary = preferred === current ? incoming : current;
  return {
    ...secondary,
    ...preferred,
    providerPostId: current.providerPostId ?? incoming.providerPostId,
    shortcode: current.shortcode ?? incoming.shortcode,
    permalink: current.permalink ?? incoming.permalink,
    caption: current.caption ?? incoming.caption,
    publishedAt: current.publishedAt ?? incoming.publishedAt,
    likeCount: current.likeCount ?? incoming.likeCount,
    commentCount: current.commentCount ?? incoming.commentCount,
    viewCount: current.viewCount ?? incoming.viewCount,
    playCount: current.playCount ?? incoming.playCount,
    durationSeconds: current.durationSeconds ?? incoming.durationSeconds,
    thumbnailUrl: current.thumbnailUrl ?? incoming.thumbnailUrl,
    mediaUrl: current.mediaUrl ?? incoming.mediaUrl,
    isPinned: current.isPinned === true || incoming.isPinned === true ? true : current.isPinned ?? incoming.isPinned,
    isCarousel: current.isCarousel ?? incoming.isCarousel,
    carouselItemsCount: current.carouselItemsCount ?? incoming.carouselItemsCount,
    hashtags: [...new Set([...current.hashtags, ...incoming.hashtags])],
    mentions: [...new Set([...current.mentions, ...incoming.mentions])],
    location: current.location ?? incoming.location,
    audio: current.audio ?? incoming.audio,
    rawDataAvailable: current.rawDataAvailable || incoming.rawDataAvailable,
  };
}

export function deduplicatePosts(posts: InstagramPost[]) {
  const output: InstagramPost[] = [];
  const aliasIndexes = new Map<string, number>();
  let duplicatesMerged = 0;
  let unidentifiedDiscarded = 0;
  for (const post of posts) {
    const postAliases = aliases(post);
    if (!postAliases.length) { unidentifiedDiscarded += 1; continue; }
    const existingIndex = postAliases.map((alias) => aliasIndexes.get(alias)).find((index): index is number => index !== undefined);
    if (existingIndex === undefined) {
      const index = output.push(post) - 1;
      for (const alias of postAliases) aliasIndexes.set(alias, index);
      continue;
    }
    duplicatesMerged += 1;
    output[existingIndex] = mergePost(output[existingIndex]!, post);
    for (const alias of aliases(output[existingIndex]!)) aliasIndexes.set(alias, existingIndex);
  }
  return { posts: output, duplicatesMerged, unidentifiedDiscarded };
}
