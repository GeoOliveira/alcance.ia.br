type OptionalSection = "ai" | "completeness" | "trend" | "structure" | "plan";

const sections: Array<{ id: string; label: string; requires?: OptionalSection }> = [
  { id: "dashboard-executivo", label: "Painel" },
  { id: "resumo", label: "Resumo" },
  { id: "prioridades", label: "Diagnóstico" },
  { id: "insights-inteligentes", label: "Insights", requires: "ai" },
  { id: "completude", label: "Completude", requires: "completeness" },
  { id: "estabilidade", label: "Engajamento" },
  { id: "tendencia", label: "Tendências", requires: "trend" },
  { id: "consistencia", label: "Consistência" },
  { id: "formatos", label: "Formatos" },
  { id: "estrutura", label: "Estrutura", requires: "structure" },
  { id: "publicacoes", label: "Publicações" },
  { id: "plano", label: "Plano", requires: "plan" },
];

export function AnalysisSectionNav({ showAI = false, showCompleteness = true, showTrend = true, showStructure = true, showPlan = true }: { showAI?: boolean; showCompleteness?: boolean; showTrend?: boolean; showStructure?: boolean; showPlan?: boolean } = {}) {
  const available: Record<OptionalSection, boolean> = { ai: showAI, completeness: showCompleteness, trend: showTrend, structure: showStructure, plan: showPlan };
  return <nav aria-label="Seções desta análise" className="analysis-section-nav"><span>Explorar relatório</span><div>{sections.filter((section) => !section.requires || available[section.requires]).map(({ id, label }) => <a href={`#${id}`} key={id}>{label}</a>)}</div></nav>;
}
