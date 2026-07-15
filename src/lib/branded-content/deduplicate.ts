import type { BrandedContentResult } from "@/lib/meta/branded-content/types";
function normalizeUrl(value: string | null) { if (!value) return null; try { const url = new URL(value); url.hash = ""; url.search = ""; return url.toString().replace(/\/$/, "").toLowerCase(); } catch { return null; } }
export function getBrandedContentDeduplicationKey(item: BrandedContentResult) {
  const url = normalizeUrl(item.contentUrl); if (url) return `url:${url}`;
  const providerId = item.providerMetadata.providerItemId; if (providerId) return `id:${providerId}`;
  return `fields:${[item.creator?.username || item.creator?.name || "", item.creationDate || "", item.type || "", ...item.partners.map((partner) => partner.username || partner.name || "").sort()].join("|").toLowerCase()}`;
}
export function deduplicateBrandedContent(items: BrandedContentResult[]) { const seen = new Set<string>(); return items.filter((item) => { const key = getBrandedContentDeduplicationKey(item); if (seen.has(key)) return false; seen.add(key); return true; }); }
