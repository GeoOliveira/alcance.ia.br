import { confidence } from "./common";
import type { HighlightsAuditResult } from "./types";

export function unavailableHighlightsAudit(): HighlightsAuditResult { return { available: false, explanationCode: "highlights_not_collected", confidence: confidence(0, 1, 1, true), count: null, categoriesFound: [], categoriesMissing: ["sobre", "serviços", "produtos", "resultados", "depoimentos", "dúvidas", "contato", "portfólio", "bastidores"], duplicateTitles: [], emptyTitles: null }; }
