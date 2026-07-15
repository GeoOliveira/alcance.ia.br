import type { Metadata } from "next";
import Link from "next/link";
import { EventTracker } from "@/components/analytics/event-tracker";
import { FeatureInterestButton } from "@/components/product-features/feature-interest-button";
import { PageHero } from "@/components/sections/page-hero";
import { Container } from "@/components/ui/container";
import { getProductFeatures } from "@/lib/product-features/access";

export const metadata: Metadata = { title: "Recursos", description: "Conheça os recursos ativos e planejados da Alcance IA.", alternates: { canonical: "/recursos" } };
const groupLabels = { profile: "Análise de perfil", category: "Descoberta por categoria", trending: "Tendências", audio: "Áudios" } as const;

export default async function Page() {
  const features = await getProductFeatures();
  return <main><EventTracker name="feature_preview_viewed" properties={{ section_id: "resources_catalog" }} /><PageHero eyebrow="RECURSOS" title="Uma leitura conectada da sua presença digital." description="Veja o que já funciona com dados públicos armazenados e o que permanece em beta ou planejamento controlado." /><section className="content-section"><Container>{Object.entries(groupLabels).map(([group, label]) => { const rows = features.filter((item) => item.group === group); return <section className="resource-catalog-group" key={group}><div className="section-heading"><span>{label}</span><h2>{label}</h2></div><div className="info-grid">{rows.map((feature) => { const active = feature.enabled && feature.status !== "inactive" && feature.visibility === "full"; return <article className="info-card" key={feature.key}><span>{active ? "ATIVO" : feature.status === "beta" ? "BETA" : "PLANEJADO"}</span><h3>{feature.name}</h3><p>{feature.description}</p><small>{feature.requires_provider_call ? "Pode consumir chamadas externas quando autorizado." : "Usa dados já disponíveis, sem chamada adicional."}</small>{!active && feature.audience === "premium" && <FeatureInterestButton featureKey={feature.key} />}</article>; })}</div></section>; })}<div className="legal-notice"><strong>Controle de disponibilidade</strong><p>Recursos premium e de descoberta não são ativados automaticamente. A disponibilidade depende do catálogo, dos limites operacionais e de fontes previamente aprovadas.</p></div></Container></section><section className="final-cta"><Container><div><h2>Conheça a análise inicial.</h2><p>Os recursos determinísticos aparecem primeiro e não aguardam a interpretação por IA.</p><Link className="button" href="/#analisar">Analisar meu perfil</Link></div></Container></section></main>;
}
