import Link from "next/link";
import { Container } from "@/components/ui/container";
import { HeroAnalysisForm } from "@/components/forms/hero-analysis-form";
import { ReportPreview } from "@/components/sections/report-preview";
import { FAQAccordion } from "@/components/sections/faq";
import { HeroProfileVisual } from "@/components/sections/hero-profile-visual";
import { getPublicSettings } from "@/lib/settings/get-settings";
import { getHomeContent, getPublicFaqs, getPublicFlags } from "@/lib/settings/public-content";
import { generatePageMetadata } from "@/lib/seo/generate-page-metadata";
import { getPageContent, splitItems, splitRows } from "@/lib/content/page-content";

export function generateMetadata() { return generatePageMetadata("home"); }

const fallbackFaqs = [
  { question: "A Alcance IA pede minha senha do Instagram?", answer: "Não. Nunca solicitamos a senha do Instagram. A proposta utiliza somente informações públicas ou dados que você autorize de forma explícita." },
  { question: "A análise completa já está disponível?", answer: "Ainda não. Esta primeira versão demonstra o formato da experiência e registra solicitações. A integração real será implementada em uma próxima fase." },
  { question: "Os dados mostrados na prévia são do meu perfil?", answer: "Não. A prévia é claramente ilustrativa e não associa métricas inventadas ao perfil informado." },
  { question: "A plataforma garante crescimento?", answer: "Não. A Alcance IA pretende apoiar decisões, mas não garante alcance, engajamento, crescimento ou qualquer resultado específico." },
];

export default async function Home() {
  const [settings, content, pageContent, databaseFaqs, flags] = await Promise.all([getPublicSettings(), getHomeContent(), getPageContent("home"), getPublicFaqs(), getPublicFlags()]);
  const faqs = databaseFaqs.length ? databaseFaqs : fallbackFaqs;
  const analysisEnabled = settings.analysisEnabled && flags.instagram_analysis !== false;
  const faqEnabled = flags.public_faq !== false;
  const previewEnabled = flags.analysis_preview !== false;
  const heroTitle = pageContent.hero_title;
  const heroParts = heroTitle.split(/\.\s+/, 2);
  const benefits = splitRows(pageContent.benefit_items);
  const resources = splitItems(pageContent.resource_items);
  const steps = splitRows(pageContent.how_steps);
  const faqJson = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) };

  return <main>
    <section className="hero" id="analisar"><Container className="hero-grid"><div className="hero-copy">
      <div className="status-chip"><span /> {pageContent.status}</div>
      <h1>{heroParts[0]}.<br />{heroParts[1] && <em>{heroParts[1]}</em>}</h1>
      <p className="hero-lead">{pageContent.hero_description}</p>
      <HeroAnalysisForm enabled={analysisEnabled} buttonLabel={content["home.hero.primary_button"]} securityNotice={content["home.hero.security_notice"]} unavailableMessage={content["home.availability.unavailable_message"]} />
      <div className="trust-inline">{splitItems(pageContent.trust_items).map((item) => <span key={item}>✓ {item}</span>)}</div>
    </div><HeroProfileVisual /></Container></section>

    <section className="trust-strip"><Container><p>Uma experiência criada para ser</p><div><span>Transparente</span><i>•</i><span>Responsável</span><i>•</i><span>Útil</span><i>•</i><span>Brasileira</span></div></Container></section>

    {previewEnabled && <section className="section report-section"><Container><div className="split-heading"><div><span className="eyebrow">{pageContent.report_eyebrow}</span><h2>{pageContent.report_title}</h2></div><p>{pageContent.report_description}</p></div><ReportPreview /><p className="demo-disclaimer">A tela acima é uma demonstração visual. Nenhum dado ilustrativo corresponde ao perfil informado.</p></Container></section>}

    <section className="section soft-section"><Container><div className="center-heading"><span className="eyebrow">POR QUE USAR</span><h2>{pageContent.benefits_title}</h2><p>{pageContent.benefits_description}</p></div><div className="benefit-grid">{benefits.map(([title, description], index) => <article key={`${title}-${index}`}><span>{["◎","⌁","✦"][index%3]}</span><h3>{title}</h3><p>{description}</p></article>)}</div></Container></section>

    <section className="section"><Container><div className="how-grid"><div className="sticky-copy"><span className="eyebrow">COMO FUNCIONA</span><h2>{pageContent.how_title}</h2><p>{pageContent.how_description}</p><Link className="arrow-link" href="/como-funciona">Conheça o processo completo →</Link></div><div className="steps-list">{steps.map(([title,description],index)=><Step key={`${title}-${index}`} number={String(index+1).padStart(2,"0")} title={title} text={description}/>)}</div></div></Container></section>

    <section className="section dark-section"><Container><div className="split-heading light"><div><span className="eyebrow">RECURSOS EM CONSTRUÇÃO</span><h2>{pageContent.resources_title}</h2></div><p>{pageContent.resources_description}</p></div><div className="resource-grid">{resources.map((resource, index) => <div key={resource}><span>{String(index + 1).padStart(2, "0")}</span><h3>{resource}</h3><i>↗</i></div>)}</div><Link className="button button-light" href="/recursos">Ver todos os recursos</Link></Container></section>

    <section className="section audience-section"><Container><div className="audience-card"><div><span className="eyebrow">PARA QUEM É</span><h2>{pageContent.audience_title}</h2><p>{pageContent.audience_description}</p></div><div className="audience-tags">{splitItems(pageContent.audience_items).map((item)=><span key={item}>{item}</span>)}</div></div></Container></section>

    <section className="section privacy-section"><Container><div className="privacy-grid"><article className="privacy-mark"><div className="privacy-mark-head"><span aria-hidden="true">↗</span><small>DADOS E MÉTODO</small></div><h3>{content["home.privacy_card.title"] || "Análise transparente"}</h3><p>{content["home.privacy_card.description"] || "As métricas são calculadas com base em dados públicos e regras verificáveis."}</p><div className="privacy-micro-chart" aria-hidden="true"><i /><i /><i /><i /></div><ul>{[content["home.privacy_card.item_1"] || "Dados públicos", content["home.privacy_card.item_2"] || "Sem senha", content["home.privacy_card.item_3"] || "Métricas explicadas"].map((item) => <li key={item}><span>✓</span>{item}</li>)}</ul></article><div><span className="eyebrow">PRIVACIDADE E SEGURANÇA</span><h2>{pageContent.privacy_title}</h2><p>{pageContent.privacy_description}</p><div className="privacy-points"><span>✓ Dados mínimos</span><span>✓ Consentimento claro</span><span>✓ Controle de cookies</span><span>✓ Exclusão facilitada</span></div><Link className="arrow-link" href="/politica-de-privacidade">Conheça nossa política →</Link></div></div></Container></section>

    {faqEnabled && <section className="section faq-section"><Container><div className="faq-grid"><div><span className="eyebrow">DÚVIDAS FREQUENTES</span><h2>Transparência também é responder antes.</h2></div><FAQAccordion items={faqs} /></div></Container></section>}

    <section className="final-cta"><Container><div><span className="eyebrow">COMECE POR AQUI</span><h2>{pageContent.final_title}</h2><p>{pageContent.final_description}</p><Link className="button button-large" href="#analisar">{pageContent.final_button} <span>→</span></Link><small>{content["home.hero.security_notice"] || "Não pedimos sua senha do Instagram."}</small></div></Container></section>
    {faqEnabled && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJson) }} />}
  </main>;
}

function Step({ number, title, text }: { number: string; title: string; text: string }) {
  return <article><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div></article>;
}
