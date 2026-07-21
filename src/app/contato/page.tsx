import { generatePageMetadata } from "@/lib/seo/generate-page-metadata";
import { PageHero } from "@/components/sections/page-hero";
import { Container } from "@/components/ui/container";
import { ContactForm } from "@/components/forms/contact-form";
import { siteConfig } from "@/config/site";
import { getPublicSettings } from "@/lib/settings/get-settings";
import { getPublicFlags } from "@/lib/settings/public-content";
import { getPageContent, splitItems } from "@/lib/content/page-content";
export function generateMetadata() { return generatePageMetadata("contact"); }
export default async function Page(){const [settings,flags,content]=await Promise.all([getPublicSettings(),getPublicFlags(),getPageContent("contact")]);const enabled=flags.contact_form!==false&&!settings.maintenanceEnabled;const email=settings.contactEmail||siteConfig.contactEmail;return <main><PageHero eyebrow={content.eyebrow} title={content.title} description={content.description}/><section className="content-section"><Container className="two-column"><div><span className="eyebrow">CONTATO</span><h2>{content.section_title}</h2><p>{content.section_text}</p><div className="bullet-list">{splitItems(content.contact_items).map((item)=><span key={item}>{item.replaceAll("{{contactEmail}}",email)}</span>)}</div></div><div className="form-shell"><ContactForm enabled={enabled}/></div></Container></section></main>}
