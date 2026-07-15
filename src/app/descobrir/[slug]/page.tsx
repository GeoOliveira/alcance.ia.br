import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventTracker } from "@/components/analytics/event-tracker";
import { FeatureInterestButton } from "@/components/product-features/feature-interest-button";
import { PageHero } from "@/components/sections/page-hero";
import { Container } from "@/components/ui/container";
import { getFeatureAccessMap } from "@/lib/product-features/access";
import { getActiveContentCategory, getCategorySnapshot } from "@/lib/product-features/discovery";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const category = await getActiveContentCategory((await params).slug);
  return { title: category ? `Descoberta: ${category.name}` : "Categoria não encontrada", description: category?.description, robots: { index: false, follow: true } };
}

export default async function CategoryDiscoveryPage({ params }: { params: Promise<{ slug: string }> }) {
  const category = await getActiveContentCategory((await params).slug);
  if (!category) notFound();
  const access = await getFeatureAccessMap();
  const hashtagAccess = access.category_hashtag_discovery;
  const reelsAccess = access.category_reels_discovery;
  const [hashtags, reels] = await Promise.all([
    hashtagAccess.allowed ? getCategorySnapshot(category.id, "hashtags") : null,
    reelsAccess.allowed ? getCategorySnapshot(category.id, "reels") : null,
  ]);
  return <main><EventTracker name="discovery_page_viewed" properties={{ section_id: `category_${category.slug}` }} /><PageHero eyebrow="DESCOBERTA POR CATEGORIA" title={category.name} description={category.description} /><section className="content-section"><Container><div className="info-grid"><article className="info-card"><span>HASHTAGS</span><h3>{hashtags ? `${hashtags.item_count} sinais armazenados` : "Recurso em preparação"}</h3><p>{hashtags?.snapshot.summary || "A leitura fica bloqueada enquanto o recurso não estiver ativo ou não houver snapshot válido."}</p>{!hashtagAccess.allowed && <FeatureInterestButton featureKey="category_hashtag_discovery" source="discovery_page" />}</article><article className="info-card"><span>REELS</span><h3>{reels ? `${reels.item_count} itens armazenados` : "Recurso em preparação"}</h3><p>{reels?.snapshot.summary || "Nenhuma chamada externa é feita ao abrir esta página."}</p>{!reelsAccess.allowed && <FeatureInterestButton featureKey="category_reels_discovery" source="discovery_page" />}</article></div><div className="legal-notice"><strong>Metodologia</strong><p>Resultados, quando disponíveis, vêm de snapshots com prazo de expiração. Rankings por views, engajamento e desempenho proporcional permanecem separados.</p></div></Container></section></main>;
}
