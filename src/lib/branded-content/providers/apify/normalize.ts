import type { BrandedContentEntity, BrandedContentResult } from "@/lib/meta/branded-content/types";
import { safeHttpsUrl, typeLabel, stableBrandedContentId } from "@/lib/meta/branded-content/normalize";
import { apifyOutputItemSchema } from "./schemas";

export function extractInstagramUsername(input: string | null | undefined) {
  const safe = safeHttpsUrl(input);
  if (!safe) return null;
  const url = new URL(safe);
  if (!["instagram.com", "www.instagram.com"].includes(url.hostname.toLowerCase())) return null;
  const parts = url.pathname.split("/").filter(Boolean);
  const candidate = parts[0] === "_u" ? parts[1] : parts.length === 1 ? parts[0] : null;
  return candidate && /^[a-zA-Z0-9._]{1,30}$/.test(candidate) ? candidate.toLowerCase() : null;
}
function normalizeEntity(raw: { name?: string | null; link?: string | null } | null | undefined): BrandedContentEntity | null {
  if (!raw) return null;
  const profileUrl = safeHttpsUrl(raw.link);
  return { id: null, name: raw.name?.trim().slice(0, 200) || null, username: extractInstagramUsername(profileUrl), profileUrl };
}
export async function normalizeApifyItem(value: unknown, fetchedAt = new Date().toISOString()): Promise<BrandedContentResult | null> {
  const parsed = apifyOutputItemSchema.safeParse(value);
  if (!parsed.success) return null;
  const raw = parsed.data; const creator = normalizeEntity(raw.creator); const partners = (raw.brandPartners || []).map(normalizeEntity).filter((item): item is BrandedContentEntity => item !== null);
  const type = raw.type?.trim().slice(0, 80) || "unknown"; const contentUrl = safeHttpsUrl(raw.link); const creationDate = raw.dateCreated && !Number.isNaN(Date.parse(raw.dateCreated)) ? new Date(`${raw.dateCreated}T00:00:00.000Z`).toISOString() : null;
  const id = await stableBrandedContentId([contentUrl, raw.id, creationDate, creator?.username, type, partners.map((partner) => partner.username || partner.name)]);
  return { id, platform: contentUrl?.includes("facebook.com") ? "facebook" : contentUrl?.includes("instagram.com") ? "instagram" : "unknown", type, typeLabel: typeLabel(type), creationDate, creator, partners, contentUrl, providerMetadata: { provider: "apify", providerItemId: raw.id || null, fetchedAt, confidence: raw.id && contentUrl ? "high" : contentUrl ? "medium" : "low" } };
}
