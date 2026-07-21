import type { Metadata } from "next";
import Link from "next/link";
import { EventTracker } from "@/components/analytics/event-tracker";
import { BrandedContentSearch } from "@/components/branded-content/branded-content-search";
import { MethodologyNotice } from "@/components/branded-content/methodology-notice";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";
import { accessError, getBrandedContentRuntime, getRequestAccess } from "@/lib/meta/branded-content/runtime";
import { generatePageMetadata } from "@/lib/seo/generate-page-metadata";
import { getPageContent, splitItems } from "@/lib/content/page-content";

export async function generateMetadata(): Promise<Metadata> {
  const runtime = await getBrandedContentRuntime();
  const index = runtime.enabled && runtime.visible && runtime.indexable && ["active", "beta"].includes(runtime.status);
  const metadata = await generatePageMetadata("branded_content", { title: "Pesquisa de Conteúdo de Marca no Instagram e Facebook", description: "Pesquise parcerias declaradas entre criadores e marcas no Instagram e Facebook.", alternates: { canonical: `${siteConfig.url}/recursos/conteudo-de-marca` }, openGraph: { title: "Pesquisa de Conteúdo de Marca", description: "Encontre conteúdos de marca declarados e veja criadores e parceiros.", url: `${siteConfig.url}/recursos/conteudo-de-marca`, type: "website" } });
  const robots = metadata.robots && typeof metadata.robots === "object" ? metadata.robots : {};
  return { ...metadata, robots: { ...robots, index: index && robots.index !== false, follow: index && robots.follow !== false } };
}

const structuredData = { "@context": "https://schema.org", "@graph": [{ "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Início", item: `${siteConfig.url}/` }, { "@type": "ListItem", position: 2, name: "Recursos", item: `${siteConfig.url}/recursos` }, { "@type": "ListItem", position: 3, name: "Pesquisa de Conteúdo de Marca", item: `${siteConfig.url}/recursos/conteudo-de-marca` }] }, { "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: "O que é conteúdo de marca?", acceptedAnswer: { "@type": "Answer", text: "É um conteúdo em que uma parceria entre criador e marca foi declarada." } }, { "@type": "Question", name: "A ferramenta encontra todos os posts de um perfil?", acceptedAnswer: { "@type": "Answer", text: "Não. A cobertura varia conforme disponibilidade, período e integração utilizada." } }] }] };

export default async function BrandedContentPage() {
  const [runtime, access, content] = await Promise.all([getBrandedContentRuntime(), getRequestAccess(), getPageContent("branded_content")]);
  const denied = accessError(runtime, access);
  const premiumPreview = denied?.code === "PREMIUM_REQUIRED" && runtime.flags.resource_branded_content_premium_preview;
  return <main className="branded-page"><EventTracker name="branded_content_page_viewed" properties={{ access_level: runtime.accessLevel, status: runtime.status }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
    <section className="reels-trending-hero branded-content-hero"><Container><nav className="reels-trending-breadcrumb" aria-label="Navegação estrutural"><Link href="/">Início</Link><span>/</span><Link href="/recursos">Recursos</Link><span>/</span><strong>Conteúdo de marca</strong></nav><div className="reels-trending-hero-grid"><div><span className="reels-trending-eyebrow">{content.eyebrow} {runtime.beta ? "· BETA" : ""}</span><h1>{content.title}</h1><p>{content.description}</p><div className="reels-trending-pills">{splitItems(content.pills).map((item)=><span key={item}>{item}</span>)}</div></div><div className="reels-trending-visual branded-content-visual" aria-hidden="true"><div><span>PARCERIAS</span><strong>↗</strong><small>marcas e criadores conectados</small></div><i>✦</i><b>CONTEÚDO</b></div></div></Container></section>
    <section className="branded-content"><Container><BrandedContentSearch allowed={!denied} reason={denied?.message} dashboardEnabled={runtime.flags.resource_branded_content_dashboard} paginationEnabled={runtime.paginationEnabled} premiumPreview={premiumPreview} /><MethodologyNotice /><section className="branded-seo"><article><h2>{content.about_title}</h2><p>{content.about_text}</p></article><article><h2>{content.finds_title}</h2><p>{content.finds_text}</p></article><article><h2>{content.limits_title}</h2><p>{content.limits_text}</p></article></section></Container></section>
  </main>;
}
