import { generatePageMetadata } from "@/lib/seo/generate-page-metadata";
import Link from "next/link";
import { PageHero } from "@/components/sections/page-hero";
import { Container } from "@/components/ui/container";
import { getPageContent, splitRows } from "@/lib/content/page-content";
export function generateMetadata() { return generatePageMetadata("how_it_works"); }
export default async function Page(){const content=await getPageContent("how_it_works");const steps=splitRows(content.steps);return <main><PageHero eyebrow={content.eyebrow} title={content.title} description={content.description}/><section className="content-section"><Container><div className="info-grid">{steps.map(([title,description],index)=><article className="info-card" key={`${title}-${index}`}><span>{String(index+1).padStart(2,"0")}</span><h3>{title}</h3><p>{description}</p></article>)}</div></Container></section><section className="content-section soft-section"><Container className="content-narrow"><h2>{content.current_title}</h2><p>{content.current_text}</p><Link className="button" href="/#analisar">{content.button}</Link></Container></section></main>}
