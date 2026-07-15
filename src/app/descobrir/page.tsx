import type { Metadata } from "next";
import Link from "next/link";
import { EventTracker } from "@/components/analytics/event-tracker";
import { PageHero } from "@/components/sections/page-hero";
import { Container } from "@/components/ui/container";
import { listActiveContentCategories } from "@/lib/product-features/discovery";

export const metadata: Metadata = { title: "Descobrir por categoria", description: "Categorias controladas para descoberta de conteúdo.", robots: { index: false, follow: true } };

export default async function DiscoverPage() {
  const categories = await listActiveContentCategories();
  return <main><EventTracker name="discovery_page_viewed" properties={{ section_id: "category_index" }} /><PageHero eyebrow="DESCOBERTA" title="Explore sinais por categoria." description="Esta área usa somente snapshots persistidos e aprovados. Abrir uma página nunca inicia uma coleta externa." /><section className="content-section"><Container>{categories.length ? <div className="info-grid">{categories.map((category, index) => <article className="info-card" key={category.id}><span>{String(index + 1).padStart(2, "0")}</span><h3>{category.name}</h3><p>{category.description}</p><Link href={`/descobrir/${category.slug}`}>Ver categoria</Link></article>)}</div> : <div className="legal-notice"><strong>Categorias em preparação</strong><p>Nenhuma categoria está habilitada no catálogo. Isso evita buscas e consumo externo antes da aprovação operacional.</p></div>}</Container></section></main>;
}
