const sections = [
  ["resumo", "Resumo"],
  ["prioridades", "Diagnóstico"],
  ["perfil", "Perfil"],
  ["engajamento", "Métricas"],
  ["consistencia", "Consistência"],
  ["formatos", "Conteúdo"],
  ["publicacoes", "Publicações"],
];

export function AnalysisSectionNav() {
  return <nav aria-label="Seções desta análise" className="analysis-section-nav"><span>Explorar relatório</span><div>{sections.map(([id, label]) => <a href={`#${id}`} key={id}>{label}</a>)}</div></nav>;
}
