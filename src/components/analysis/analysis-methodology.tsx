import { AnalysisIcon } from "./analysis-icon";

export function AnalysisMethodology({ postsCount }: { postsCount: number }) {
  return <section className="analysis-methodology" id="metodologia"><details><summary><span><AnalysisIcon name="info" /></span><div><strong>Como calculamos estes dados</strong><small>Fonte, amostra e limitações desta leitura</small></div><b aria-hidden="true">+</b></summary><div className="analysis-methodology-content"><p>Usamos apenas dados públicos disponíveis no momento da coleta. As métricas representam uma estimativa baseada em <strong>{postsCount} {postsCount === 1 ? "publicação analisada" : "publicações analisadas"}</strong>.</p><ul><li>Médias ignoram campos ausentes em vez de transformá-los em zero.</li><li>Engajamento estimado considera curtidas e comentários conhecidos em relação aos seguidores.</li><li>Este relatório não substitui o Instagram Insights, que possui dados privados e históricos da conta.</li></ul></div></details></section>;
}
