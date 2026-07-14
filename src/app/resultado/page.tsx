import type { Metadata } from "next";
import { AnalyticsLink } from "@/components/analytics/analytics-link";
import { EventTracker } from "@/components/analytics/event-tracker";
import { PageHero } from "@/components/sections/page-hero";
import { Container } from "@/components/ui/container";
import { ReportPreview } from "@/components/sections/report-preview";

export const metadata: Metadata = {
  title: "Demonstração da análise",
  description: "Prévia demonstrativa do relatório Alcance IA.",
  alternates: { canonical: "/resultado" },
  robots: { index: false, follow: false },
};

const blocks = [
  ["Análise da bio", "Estrutura prevista para avaliar clareza, proposta e chamada para ação."],
  ["Consistência", "Organização visual futura de frequência, temas e formatos."],
  ["Engajamento estimado", "Área reservada para estimativas devidamente identificadas e contextualizadas."],
  ["Desempenho de conteúdo", "Comparação futura de sinais autorizados, sem garantias de resultado."],
  ["Oportunidades", "Espaço para pontos de atenção e caminhos possíveis."],
  ["Recomendações", "Sugestões explicadas, priorizadas e abertas à sua decisão."],
  ["Ideias de conteúdo", "Pontos de partida assistivos para desenvolver com sua própria voz."],
];

export default function Page() {
  return (
    <main>
      <EventTracker name="analysis_preview_viewed" />
      <PageHero eyebrow="VERSÃO INICIAL" title="Demonstração da análise Alcance IA" description="Os dados abaixo são uma demonstração de como o relatório completo será apresentado. Não correspondem ao perfil informado." />
      <section className="content-section">
        <Container>
          <ReportPreview />
          <div className="info-grid">{blocks.map(([title, description], index) => <article className="info-card" key={title}><span>{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{description}</p></article>)}</div>
        </Container>
      </section>
      <section className="final-cta">
        <Container><div><span className="eyebrow">ACOMPANHE A EVOLUÇÃO</span><h2>Conheça como será o futuro registro de interesse.</h2><p>A autenticação e o envio ainda estão em preparação. Nenhuma conta é criada nesta fase.</p><AnalyticsLink className="button" href="/cadastro" eventName="signup_cta_clicked" properties={{ cta_location: "analysis_preview" }}>Ver demonstração de cadastro →</AnalyticsLink></div></Container>
      </section>
    </main>
  );
}
