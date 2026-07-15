import type { BrandedContentResult } from "./types";
export function deduplicateResults(results: BrandedContentResult[]) { return [...new Map(results.map((item) => [item.id, item])).values()]; }
export function extractAfter(paging: { cursors?: { after?: string }; next?: string } | undefined) { const value = paging?.cursors?.after; return typeof value === "string" && value.length <= 1000 && !/[\u0000-\u001f\u007f]/.test(value) ? value : null; }
