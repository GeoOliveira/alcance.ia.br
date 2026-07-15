import type { BrandedContentEntity, BrandedContentResult } from "./types";
export function normalizeInstagramUsername(input: string) { const value = input.trim().replace(/^@/, "").toLowerCase(); if (!/^[a-z0-9._]{1,30}$/.test(value) || value.includes("..") || /[/?#@]/.test(value)) throw new Error("invalid_username"); return value; }
export function normalizeFacebookPageUrl(input: string) {
  let url: URL; try { url = new URL(input.trim()); } catch { throw new Error("invalid_page_url"); }
  if (url.protocol !== "https:" || url.username || url.password || !["facebook.com", "www.facebook.com"].includes(url.hostname.toLowerCase())) throw new Error("invalid_page_url");
  const parts = url.pathname.split("/").filter(Boolean); const blocked = new Set(["groups", "profile.php", "people", "posts", "watch", "reel", "share", "events", "marketplace"]);
  if (parts.length !== 1 || blocked.has(parts[0].toLowerCase()) || url.search || url.hash) throw new Error("invalid_page_url");
  return `https://www.facebook.com/${encodeURIComponent(decodeURIComponent(parts[0]))}`;
}
export function safeHttpsUrl(input: unknown) { if (typeof input !== "string") return null; try { const url = new URL(input); return url.protocol === "https:" && !url.username && !url.password ? url.toString() : null; } catch { return null; } }
function entity(value: { id?: string | number; name?: string; url?: string } | null | undefined): BrandedContentEntity | null {
  if (!value) return null; const profileUrl = safeHttpsUrl(value.url); let username: string | null = null;
  if (profileUrl) { const url = new URL(profileUrl); if (["www.instagram.com", "instagram.com"].includes(url.hostname)) username = url.pathname.split("/").filter(Boolean)[0]?.toLowerCase() || null; }
  return { id: value.id == null ? null : String(value.id), name: value.name?.trim().slice(0, 200) || null, username, profileUrl };
}
const labels: Record<string, string> = { REEL: "Reel", VIDEO: "Vídeo", PHOTO: "Imagem", IMAGE: "Imagem", STORY: "Story", POST: "Publicação", FACEBOOK_POST: "Publicação", INSTAGRAM_POST: "Publicação", INSTAGRAM_STORY: "Story", INSTAGRAM_REEL: "Reel", UNKNOWN: "Conteúdo" };
export function typeLabel(type: string) { return labels[type.toUpperCase()] || "Conteúdo"; }
export async function stableBrandedContentId(parts: unknown[]) { const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(JSON.stringify(parts))); return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("").slice(0, 32); }
export async function normalizeResult(raw: { creation_date?: string; creator?: { id?: string | number; name?: string; url?: string } | null; partners?: { id?: string | number; name?: string; url?: string }[]; type?: string; url?: string }): Promise<BrandedContentResult> {
  const fetchedAt = new Date().toISOString(); const creator = entity(raw.creator); const partners = (raw.partners || []).map(entity).filter((item): item is BrandedContentEntity => item !== null); const type = raw.type?.trim().slice(0, 80) || "UNKNOWN"; const creationDate = raw.creation_date && !Number.isNaN(Date.parse(raw.creation_date)) ? new Date(raw.creation_date).toISOString() : null; const contentUrl = safeHttpsUrl(raw.url); const id = await stableBrandedContentId([contentUrl, creationDate, creator?.id, creator?.name, type]);
  return { id, platform: contentUrl?.includes("facebook.com") ? "facebook" : contentUrl?.includes("instagram.com") ? "instagram" : "unknown", type, typeLabel: typeLabel(type), creationDate, creator, partners, contentUrl, providerMetadata: { provider: "meta_official", providerItemId: null, fetchedAt, confidence: contentUrl && creator ? "high" : creator ? "medium" : "low" } };
}
