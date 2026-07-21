import { generatePageMetadata } from "@/lib/seo/generate-page-metadata";
import Link from "next/link";
import { EventTracker } from "@/components/analytics/event-tracker";
import { FeatureInterestButton } from "@/components/product-features/feature-interest-button";
import { PageHero } from "@/components/sections/page-hero";
import { Container } from "@/components/ui/container";
import { decideFeatureAccess, getProductFeatures } from "@/lib/product-features/access";
import { getPageContent } from "@/lib/content/page-content";

export function generateMetadata() { return generatePageMetadata("resources"); }
const groupLabels = { profile: "Análise de perfil", category: "Descoberta por categoria", trending: "Tendências", audio: "Áudios" } as const;
const resourceLinks: Partial<Record<string, { href: string; label: string }>> = {
  resource_hashtags: { href: "/recursos/hashtags", label: "Explorar hashtags" },
  resource_trending_reels: { href: "/recursos/reels-em-alta", label: "Ver Reels em alta" },
  resource_reels_by_category: { href: "/recursos/reels-por-categoria", label: "Explorar categorias" },
  branded_content_search: { href: "/recursos/conteudo-de-marca", label: "Pesquisar parcerias" },
  whatsapp_link_generator: { href: "/recursos/gerador-link-whatsapp", label: "Criar link do WhatsApp" },
};

export default async function Page() {
  const [features, content] = await Promise.all([getProductFeatures(), getPageContent("resources")]);
  return <main>
    <EventTracker name="feature_preview_viewed" properties={{ section_id: "resources_catalog" }} />
    <PageHero eyebrow={content.eyebrow} title={content.title} description={content.description} />
    <section className="content-section"><Container>
      {Object.entries(groupLabels).map(([group, label]) => {
        const rows = features.filter((item) => item.group === group);
        return <section className="resource-catalog-group" key={group}><div className="section-heading"><span>{label}</span><h2>{label}</h2></div><div className="info-grid">{rows.map((feature) => {
          const active = decideFeatureAccess(feature).allowed;
          const resourceLink = resourceLinks[feature.key];
          return <article className="info-card" key={feature.key}><span>{active ? "ATIVO" : feature.status === "beta" ? "BETA" : "PLANEJADO"}</span><h3>{feature.name}</h3><p>{feature.description}</p><small>{feature.requires_provider_call ? "Pode consumir chamadas externas quando autorizado." : "Usa dados já disponíveis, sem chamada adicional."}</small>{active && resourceLink && <Link className="arrow-link" href={resourceLink.href}>{resourceLink.label}</Link>}{!active && feature.audience === "premium" && <FeatureInterestButton featureKey={feature.key} />}</article>;
        })}</div></section>;
      })}
      <div className="legal-notice"><strong>{content.notice_title}</strong><p>{content.notice_text}</p></div>
    </Container></section>
    <section className="final-cta"><Container><div><h2>{content.final_title}</h2><p>{content.final_text}</p><Link className="button" href="/#analisar">{content.final_button}</Link></div></Container></section>
  </main>;
}
