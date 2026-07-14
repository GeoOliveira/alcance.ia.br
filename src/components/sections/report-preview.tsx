const items = [
  ["01", "Bio e posicionamento", "Clareza da proposta, palavras-chave e chamada para ação."],
  ["02", "Consistência de conteúdo", "Leitura organizada de frequência, formatos e temas."],
  ["03", "Oportunidades", "Pontos de atenção e caminhos práticos para evoluir."],
];

export function ReportPreview() {
  return <div className="report-window"><div className="report-top"><div><span className="report-kicker">PRÉVIA DO RELATÓRIO</span><strong>Visão geral do perfil</strong></div><span className="demo-pill">Dados ilustrativos</span></div><div className="report-body"><div className="report-score"><span>Leitura estruturada</span><div className="score-orbit"><strong>IA</strong></div><p>Um ponto de partida visual para organizar oportunidades — sem métricas fictícias associadas ao seu perfil.</p></div><div className="report-list">{items.map(([number, title, text]) => <div key={number}><span>{number}</span><div><strong>{title}</strong><p>{text}</p></div><i aria-hidden="true">→</i></div>)}</div></div></div>;
}
