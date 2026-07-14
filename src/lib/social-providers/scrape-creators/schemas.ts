import { z } from "zod";

const nullableString = z.string().nullable().optional();
const nullableNumber = z.number().nullable().optional();
const nullableBoolean = z.boolean().nullable().optional();
const captionSchema = z.union([z.string(), z.object({ text: nullableString }).passthrough()]).nullable().optional();

export const profileUserSchema = z.object({
  id: nullableString, pk: z.union([z.string(), z.number()]).nullable().optional(), username: nullableString,
  full_name: nullableString, biography: nullableString, profile_pic_url: nullableString,
  external_url: nullableString, follower_count: nullableNumber, following_count: nullableNumber,
  media_count: nullableNumber, is_private: nullableBoolean, is_verified: nullableBoolean,
  is_business: nullableBoolean, category: nullableString,
  edge_followed_by: z.object({ count: nullableNumber }).passthrough().nullable().optional(),
  edge_follow: z.object({ count: nullableNumber }).passthrough().nullable().optional(),
  edge_owner_to_timeline_media: z.object({ count: nullableNumber }).passthrough().nullable().optional(),
}).passthrough();

export const profileResponseSchema = z.object({
  success: z.boolean().optional(), data: z.object({ user: profileUserSchema.optional() }).passthrough().optional(),
  user: profileUserSchema.optional(),
}).passthrough();

export const postItemSchema = z.object({
  id: z.union([z.string(), z.number()]).nullable().optional(), pk: z.union([z.string(), z.number()]).nullable().optional(),
  shortcode: nullableString, code: nullableString, url: nullableString, permalink: nullableString,
  media_type: z.union([z.string(), z.number()]).nullable().optional(), product_type: nullableString,
  caption: captionSchema, taken_at: z.union([z.string(), z.number()]).nullable().optional(),
  like_count: nullableNumber, comment_count: nullableNumber, view_count: nullableNumber,
  play_count: nullableNumber, ig_play_count: nullableNumber, video_play_count: nullableNumber,
  video_duration: nullableNumber, duration: nullableNumber, thumbnail_src: nullableString,
  display_url: nullableString, display_uri: nullableString, image_url: nullableString, video_url: nullableString,
  video_versions: z.array(z.object({ url: nullableString }).passthrough()).optional(), is_pinned: nullableBoolean,
  carousel_media: z.array(z.unknown()).optional(), edge_sidecar_to_children: z.object({ edges: z.array(z.unknown()).optional() }).passthrough().optional(),
  location: z.object({ id: z.union([z.string(), z.number()]).nullable().optional(), name: nullableString }).passthrough().nullable().optional(),
  clips_metadata: z.unknown().optional(), music_metadata: z.unknown().optional(),
}).passthrough();

export const postsResponseSchema = z.object({
  success: z.boolean().optional(), items: z.array(postItemSchema).optional(), posts: z.array(postItemSchema).optional(),
  next_max_id: nullableString, more_available: nullableBoolean,
}).passthrough();

export const reelsResponseSchema = z.object({
  success: z.boolean().optional(), items: z.array(z.union([postItemSchema, z.object({ media: postItemSchema }).passthrough()])).optional(), reels: z.array(postItemSchema).optional(),
  paging_info: z.object({ max_id: nullableString, more_available: nullableBoolean }).passthrough().optional(),
  next_max_id: nullableString,
}).passthrough();

export const postDetailsResponseSchema = z.object({
  success: z.boolean().optional(), data: z.object({ xdt_shortcode_media: postItemSchema.optional() }).passthrough().optional(),
  item: postItemSchema.optional(), post: postItemSchema.optional(),
}).passthrough();

export const endpointSchemas = { profile: profileResponseSchema, posts: postsResponseSchema, reels: reelsResponseSchema, post_details: postDetailsResponseSchema } as const;
