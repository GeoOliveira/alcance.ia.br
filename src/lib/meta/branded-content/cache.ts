import "server-only";
import type { BrandedContentSearchResponse } from "./types";
type Entry = { expiresAt: number; value: BrandedContentSearchResponse }; const cache = new Map<string, Entry>();
export function cacheKey(parts: string[]) { return parts.join("\u001f"); }
export function getCachedSearch(key: string) { const row = cache.get(key); if (!row || row.expiresAt <= Date.now()) { cache.delete(key); return null; } return structuredClone(row.value); }
export function setCachedSearch(key: string, value: BrandedContentSearchResponse, minutes: number) { cache.set(key, { value: structuredClone(value), expiresAt: Date.now() + Math.max(1, minutes) * 60000 }); }
export function clearBrandedContentCacheForTests() { cache.clear(); }
