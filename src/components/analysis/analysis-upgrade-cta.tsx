import { AnalyticsLink } from "@/components/analytics/analytics-link";
import { AnalysisIcon } from "./analysis-icon";

const features = [
  ["Análise da bio", "Leitura de clareza, proposta e chamada para ação."],
  ["Recomendações", "Próximas ações personalizadas para o perfil."],
  ["Ideias de conteúdo", "Sugestões alinhadas aos sinais observados."],
  ["Sugestões de legendas", "Apoio para estruturar textos futuros."],
];

export function AnalysisUpgradeCta({ requestId }: { requestId: string }) {
  return <><section className="analysis-future" id="proximos-passos"><div className="analysis-future-inner"><div className="analysis-future-copy"><span className="eyebrow">INSIGHTS INTELIGENTES · EM BREVE</span><h2>Uma camada de inteligência preparada para o próximo passo.</h2><p>Esses recursos ainda não estão ativos e nenhum conteúdo de IA foi simulado nesta análise.</p></div><div className="analysis-ai-grid">{features.map(([title, description]) => <article key={title}><span><AnalysisIcon name="spark" /></span><div><small>EM BREVE</small><h3>{title}</h3><p>{description}</p></div></article>)}</div></div></section><section className="analysis-final-cta"><div><span className="eyebrow">ACOMPANHE SUA EVOLUÇÃO</span><h2>Salve esta análise e acompanhe a evolução do seu perfil.</h2><p>Em breve você poderá acessar histórico, recomendações e insights personalizados.</p><div className="analysis-cta-benefits"><span>Histórico organizado</span><span>Novos recursos primeiro</span><span>Cadastro gratuito</span></div><AnalyticsLink className="button button-light" href="/cadastro" eventName="analysis_final_cta_clicked" properties={{ request_id: requestId, cta_location: "analysis_final" }}>Criar conta gratuita <span aria-hidden="true">→</span></AnalyticsLink></div></section></>;
}
