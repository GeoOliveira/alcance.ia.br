import type { BrandedContentProviderResult } from "./contracts/search-result";
const NORMALIZER_VERSION = "2";
const cache = new Map<string, { expiresAt: number; value: BrandedContentProviderResult }>();
export function brandedContentCacheKey(parts: Array<string | number>) { return [NORMALIZER_VERSION, ...parts].join("\u001f"); }
export function getBrandedContentCache(key: string) { const item = cache.get(key); if (!item || item.expiresAt <= Date.now()) { cache.delete(key); return null; } return structuredClone(item.value); }
export function setBrandedContentCache(key: string, value: BrandedContentProviderResult, minutes: number) { cache.set(key, { value: structuredClone(value), expiresAt: Date.now() + Math.max(1, minutes) * 60_000 }); }
