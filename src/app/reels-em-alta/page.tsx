import type { Metadata } from "next";
import { EventTracker } from "@/components/analytics/event-tracker";
import { FeatureInterestButton } from "@/components/product-features/feature-interest-button";
import { PageHero } from "@/components/sections/page-hero";
import { Container } from "@/components/ui/container";
import { getFeatureAccessMap } from "@/lib/product-features/access";
import { getTrendingSnapshot } from "@/lib/product-features/discovery";

export const metadata: Metadata = { title: "Reels em alta", description: "Área controlada de tendências em Reels.", robots: { index: false, follow: true } };

export default async function TrendingReelsPage() {
  const access = await getFeatureAccessMap();
  const decision = access.trending_reels;
  const snapshot = decision.allowed ? await getTrendingSnapshot("reels") : null;
  return <main><EventTracker name="discovery_page_viewed" properties={{ section_id: "trending_reels" }} /><PageHero eyebrow="TENDÊNCIAS" title="Reels em alta, com contexto e controle." description="A página lê somente snapshots válidos. Tendências não são buscadas automaticamente durante a navegação." /><section className="content-section"><Container>{snapshot ? <div className="legal-notice"><strong>{snapshot.item_count} itens no snapshot atual</strong><p>{snapshot.snapshot.summary || "Snapshot disponível para apresentação estruturada."}</p></div> : <div className="legal-notice"><strong>Recurso em preparação</strong><p>A integração atual não possui um endpoint de tendências aprovado. Por isso, nenhuma chamada externa é realizada.</p><FeatureInterestButton featureKey="trending_reels" source="discovery_page" /></div>}</Container></section></main>;
}
