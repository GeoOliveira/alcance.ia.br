const sections = [
  ["resumo", "Resumo"],
  ["prioridades", "Diagnóstico"],
  ["completude", "Completude"],
  ["estabilidade", "Engajamento"],
  ["tendencia", "Tendência"],
  ["consistencia", "Consistência"],
  ["formatos", "Formatos"],
  ["estrutura", "Estrutura"],
  ["publicacoes", "Publicações"],
  ["plano", "Plano"],
];

export function AnalysisSectionNav() {
  return <nav aria-label="Seções desta análise" className="analysis-section-nav"><span>Explorar relatório</span><div>{sections.map(([id, label]) => <a href={`#${id}`} key={id}>{label}</a>)}</div></nav>;
}
