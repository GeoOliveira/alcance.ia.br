import type { Metadata } from "next";
import Link from "next/link";
import { EventTracker } from "@/components/analytics/event-tracker";
import { BrandedContentSearch } from "@/components/branded-content/branded-content-search";
import { MethodologyNotice } from "@/components/branded-content/methodology-notice";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";
import { accessError, getBrandedContentRuntime, getRequestAccess } from "@/lib/meta/branded-content/runtime";

export async function generateMetadata(): Promise<Metadata> {
  const runtime = await getBrandedContentRuntime();
  const index = runtime.enabled && runtime.visible && runtime.indexable && ["active", "beta"].includes(runtime.status);
  return { title: "Pesquisa de Conteúdo de Marca no Instagram e Facebook", description: "Pesquise parcerias declaradas entre criadores e marcas no Instagram e Facebook.", alternates: { canonical: `${siteConfig.url}/recursos/conteudo-de-marca` }, robots: { index, follow: index }, openGraph: { title: "Pesquisa de Conteúdo de Marca", description: "Encontre conteúdos de marca declarados e veja criadores e parceiros.", url: `${siteConfig.url}/recursos/conteudo-de-marca`, type: "website", images: [{ url: `${siteConfig.url}/og.png`, width: 1200, height: 630, alt: "Alcance IA" }] } };
}

const structuredData = { "@context": "https://schema.org", "@graph": [{ "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Início", item: `${siteConfig.url}/` }, { "@type": "ListItem", position: 2, name: "Recursos", item: `${siteConfig.url}/recursos` }, { "@type": "ListItem", position: 3, name: "Pesquisa de Conteúdo de Marca", item: `${siteConfig.url}/recursos/conteudo-de-marca` }] }, { "@type": "FAQPage", mainEntity: [{ "@type": "Question", name: "O que é conteúdo de marca?", acceptedAnswer: { "@type": "Answer", text: "É um conteúdo em que uma parceria entre criador e marca foi declarada." } }, { "@type": "Question", name: "A ferramenta encontra todos os posts de um perfil?", acceptedAnswer: { "@type": "Answer", text: "Não. A cobertura varia conforme disponibilidade, período e integração utilizada." } }] }] };

export default async function BrandedContentPage() {
  const [runtime, access] = await Promise.all([getBrandedContentRuntime(), getRequestAccess()]);
  const denied = accessError(runtime, access);
  const premiumPreview = denied?.code === "PREMIUM_REQUIRED" && runtime.flags.resource_branded_content_premium_preview;
  return <main className="branded-page"><EventTracker name="branded_content_page_viewed" properties={{ access_level: runtime.accessLevel, status: runtime.status }} /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
    <section className="reels-trending-hero branded-content-hero"><Container><nav className="reels-trending-breadcrumb" aria-label="Navegação estrutural"><Link href="/">Início</Link><span>/</span><Link href="/recursos">Recursos</Link><span>/</span><strong>Conteúdo de marca</strong></nav><div className="reels-trending-hero-grid"><div><span className="reels-trending-eyebrow">PESQUISA DE CONTEÚDO DE MARCA {runtime.beta ? "· BETA" : ""}</span><h1>Descubra parcerias entre marcas e criadores.</h1><p>Pesquise conteúdos de marca declarados no Instagram e Facebook e veja quais criadores e empresas participaram.</p><div className="reels-trending-pills"><span>Instagram e Facebook</span><span>Dados declarados</span><span>Resultados em cache</span></div></div><div className="reels-trending-visual branded-content-visual" aria-hidden="true"><div><span>PARCERIAS</span><strong>↗</strong><small>marcas e criadores conectados</small></div><i>✦</i><b>CONTEÚDO</b></div></div></Container></section>
    <section className="branded-content"><Container><BrandedContentSearch allowed={!denied} reason={denied?.message} dashboardEnabled={runtime.flags.resource_branded_content_dashboard} paginationEnabled={runtime.paginationEnabled} premiumPreview={premiumPreview} /><MethodologyNotice /><section className="branded-seo"><article><h2>O que é conteúdo de marca?</h2><p>É uma publicação em que uma relação comercial ou outra troca de valor foi declarada.</p></article><article><h2>O que a ferramenta encontra?</h2><p>Tipos, datas, criadores, parceiros e links presentes nas respostas normalizadas. Os campos variam conforme a fonte.</p></article><article><h2>O que ela não encontra?</h2><p>Conteúdos privados, posts removidos, todas as publicações de uma conta, alcance, vendas ou ROI.</p></article></section></Container></section>
  </main>;
}
