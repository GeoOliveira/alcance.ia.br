export function formatCompactNumber(value: number | null) { return value === null ? "Não disponível" : new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 }).format(value); }
export function formatDecimal(value: number | null, digits = 1) { return value === null ? "Dados insuficientes" : new Intl.NumberFormat("pt-BR", { maximumFractionDigits: digits }).format(value); }
export function formatPercentage(value: number | null) { return value === null ? "Dados insuficientes" : `${formatDecimal(value, 2)}%`; }
export function formatDateTime(value: string) { return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Sao_Paulo" }).format(new Date(value)); }
