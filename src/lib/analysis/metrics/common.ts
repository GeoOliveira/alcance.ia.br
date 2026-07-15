import type { Confidence } from "./types";

export const known = (values: Array<number | null>) => values.filter((value): value is number => value !== null && Number.isFinite(value));
export const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
export function median(values: number[]) { if (!values.length) return null; const sorted = [...values].sort((a, b) => a - b); const middle = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2; }
export function standardDeviation(values: number[]) { const mean = average(values); if (mean === null || values.length < 2) return null; return Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length); }
export function coefficientOfVariation(values: number[]) { const mean = average(values), deviation = standardDeviation(values); return mean && deviation !== null ? deviation / mean : null; }
export const percent = (part: number, total: number) => total > 0 ? part / total * 100 : null;
export function percentageChange(older: number | null, recent: number | null) { return older !== null && recent !== null && older !== 0 ? (recent - older) / Math.abs(older) * 100 : null; }
export function confidence(sampleSize: number, medium: number, high: number, unavailable = false): Confidence { if (unavailable) return { level: "unavailable", sampleSize, reason: "Os campos necessários não estão disponíveis." }; if (sampleSize >= high) return { level: "high", sampleSize, reason: `Amostra de ${sampleSize} publicações com campos suficientes.` }; if (sampleSize >= medium) return { level: "medium", sampleSize, reason: `A análise utiliza ${sampleSize} publicações recentes.` }; return { level: "low", sampleSize, reason: `A amostra contém apenas ${sampleSize} publicações.` }; }
export function validDates(values: Array<string | null>) { return values.map((value) => value ? new Date(value) : null).filter((value): value is Date => Boolean(value && !Number.isNaN(value.getTime()))).sort((a, b) => a.getTime() - b.getTime()); }
export function postInteractions(likes: number | null, comments: number | null) { return likes === null && comments === null ? null : (likes ?? 0) + (comments ?? 0); }
