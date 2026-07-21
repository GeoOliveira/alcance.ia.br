import { generatePageMetadata } from "@/lib/seo/generate-page-metadata";
import { PageHero } from "@/components/sections/page-hero";
import { Container } from "@/components/ui/container";
import { getPageContent, splitItems } from "@/lib/content/page-content";
export function generateMetadata() { return generatePageMetadata("about"); }
export default async function Page(){const content=await getPageContent("about");return <main><PageHero eyebrow={content.eyebrow} title={content.title} description={content.description}/><section className="content-section"><Container className="two-column"><div><h2>{content.direction_title}</h2><p>{content.direction_text_1}</p><p>{content.direction_text_2}</p></div><div className="bullet-list">{splitItems(content.principles).map((item)=><span key={item}>{item}</span>)}</div></Container></section><section className="content-section soft-section"><Container className="content-narrow"><h2>{content.notice_title}</h2><p>{content.notice_text}</p></Container></section></main>}
