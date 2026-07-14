import type { InstagramPost } from "../contracts/instagram-post";
import type { InstagramProfile } from "../contracts/instagram-profile";
import type { FieldInventory, ProviderEndpoint, ValidationIssue } from "../contracts/provider-result";

type JsonObject = Record<string, unknown>;
const object = (value: unknown): JsonObject => value !== null && typeof value === "object" && !Array.isArray(value) ? value as JsonObject : {};
const string = (value: unknown) => typeof value === "string" ? value : typeof value === "number" ? String(value) : null;
const number = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? value : null;
const boolean = (value: unknown) => typeof value === "boolean" ? value : null;
const first = (...values: unknown[]) => values.find((value) => value !== undefined && value !== null);

export function mapProfile(raw: unknown, fetchedAt: string): InstagramProfile {
  const root = object(raw); const data = object(root.data); const user = object(first(data.user, root.user, raw));
  const followed = object(user.edge_followed_by); const following = object(user.edge_follow); const timeline = object(user.edge_owner_to_timeline_media);
  return {
    provider: "scrapecreators", providerUserId: string(first(user.id, user.pk)), username: string(user.username),
    displayName: string(user.full_name), biography: string(user.biography), profileImageUrl: string(first(user.profile_pic_url, user.profile_pic_url_hd)),
    externalUrl: string(user.external_url), followersCount: number(first(user.follower_count, followed.count)),
    followingCount: number(first(user.following_count, following.count)), postsCount: number(first(user.media_count, timeline.count)),
    isPrivate: boolean(user.is_private), isVerified: boolean(user.is_verified), isBusiness: boolean(first(user.is_business, user.is_professional_account)),
    category: string(first(user.category, user.category_name)), rawDataAvailable: true, fetchedAt,
  };
}

function captionText(value: unknown) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return captionText(object(value[0]).node ?? value[0]);
  return string(object(value).text);
}
function isoDate(value: unknown) {
  if (typeof value === "number") return new Date(value > 10_000_000_000 ? value : value * 1000).toISOString();
  if (typeof value === "string") { const date = new Date(value); return Number.isNaN(date.getTime()) ? null : date.toISOString(); }
  return null;
}
function mediaType(item: JsonObject): InstagramPost["mediaType"] {
  const carousel = Array.isArray(item.carousel_media) || Array.isArray(object(item.edge_sidecar_to_children).edges);
  if (carousel || item.media_type === 8 || item.__typename === "XDTGraphSidecar") return "carousel";
  if (item.media_type === 2 || item.product_type === "clips" || item.__typename === "XDTGraphVideo") return "video";
  if (item.media_type === 1 || item.__typename === "XDTGraphImage") return "image";
  return "unknown";
}
function tags(text: string | null, pattern: RegExp) { return text ? [...text.matchAll(pattern)].map((match) => match[1]!.toLowerCase()) : []; }

export function mapPost(raw: unknown): InstagramPost {
  const item = object(raw); const caption = captionText(item.caption ?? object(item.edge_media_to_caption).edges); const shortcode = string(first(item.shortcode, item.code));
  const carousel = Array.isArray(item.carousel_media) ? item.carousel_media : object(item.edge_sidecar_to_children).edges;
  const location = object(item.location); const clips = object(item.clips_metadata); const originalAudio = object(clips.original_sound_info); const music = object(clips.music_info); const musicMeta = object(item.music_metadata);
  const type = mediaType(item);
  return {
    providerPostId: string(first(item.id, item.pk)), shortcode, permalink: string(first(item.url, item.permalink)) ?? (shortcode ? `https://www.instagram.com/p/${shortcode}/` : null),
    mediaType: type, caption, publishedAt: isoDate(first(item.taken_at, item.timestamp)), likeCount: number(first(item.like_count, object(item.edge_media_preview_like).count)),
    commentCount: number(first(item.comment_count, object(item.edge_media_to_parent_comment).count)), viewCount: number(first(item.view_count, item.video_view_count)),
    playCount: number(first(item.play_count, item.ig_play_count, item.video_play_count)), durationSeconds: number(first(item.video_duration, item.duration)),
    thumbnailUrl: string(first(item.thumbnail_src, item.display_url, item.display_uri, item.image_url)),
    mediaUrl: string(first(item.video_url, object(Array.isArray(item.video_versions) ? item.video_versions[0] : null).url, item.display_url)),
    isPinned: boolean(item.is_pinned), isCarousel: type === "carousel" ? true : boolean(item.is_carousel),
    carouselItemsCount: Array.isArray(carousel) ? carousel.length : null, hashtags: tags(caption, /#([\p{L}\p{N}_.]+)/gu), mentions: tags(caption, /@([a-z0-9_.]+)/gi),
    location: Object.keys(location).length ? { id: string(location.id), name: string(location.name) } : null,
    audio: Object.keys(originalAudio).length || Object.keys(music).length || Object.keys(musicMeta).length ? {
      id: string(first(originalAudio.audio_asset_id, music.audio_id, musicMeta.music_canonical_id)),
      title: string(first(originalAudio.original_audio_title, music.title, musicMeta.song_name)), artist: string(first(object(originalAudio.ig_artist).username, music.display_artist, musicMeta.artist_name)),
    } : null, rawDataAvailable: true,
  };
}

export function extractItems(endpoint: ProviderEndpoint, raw: unknown) {
  const root = object(raw);
  if (endpoint === "post_details") return [first(object(root.data).xdt_shortcode_media, root.item, root.post)].filter(Boolean);
  const items = (Array.isArray(root.items) ? root.items : Array.isArray(root.posts) ? root.posts : Array.isArray(root.reels) ? root.reels : []) as unknown[];
  return endpoint === "reels" ? items.map((item) => object(item).media ?? item) : items;
}

const expected: Record<ProviderEndpoint, string[]> = {
  profile: ["data.user.username", "data.user.id", "data.user.biography", "data.user.is_private"],
  posts: ["items", "next_max_id"], reels: ["items", "paging_info.max_id"], post_details: ["data.xdt_shortcode_media"],
};
function flatten(value: unknown, prefix = "", output: { found: string[]; nulls: string[] } = { found: [], nulls: [] }) {
  if (prefix) { output.found.push(prefix); if (value === null) output.nulls.push(prefix); }
  if (value && typeof value === "object" && !Array.isArray(value)) for (const [key, child] of Object.entries(value)) flatten(child, prefix ? `${prefix}.${key}` : key, output);
  if (Array.isArray(value) && value[0] !== undefined) flatten(value[0], `${prefix}[]`, output);
  return output;
}
export function inventory(endpoint: ProviderEndpoint, raw: unknown, issues: ValidationIssue[]): FieldInventory {
  const flat = flatten(raw); const missing = expected[endpoint].filter((path) => !flat.found.includes(path));
  const knownRoots = new Set(endpoint === "profile" || endpoint === "post_details" ? ["success", "data", "user", "item", "post", "credits_remaining"] : ["success", "items", "posts", "reels", "next_max_id", "more_available", "paging_info", "status", "user", "credits_remaining"]);
  const unknown = Object.keys(object(raw)).filter((key) => !knownRoots.has(key));
  return { found: flat.found, missing, null: flat.nulls, unexpected: issues.filter((issue) => issue.kind === "unexpected_type"), unknown };
}
