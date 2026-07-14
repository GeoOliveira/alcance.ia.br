import type { Metadata } from "next";
import { PageHero } from "@/components/sections/page-hero";
import { Container } from "@/components/ui/container";
import { ContactForm } from "@/components/forms/contact-form";
import { siteConfig } from "@/config/site";
export const metadata: Metadata={title:"Contato",description:"Fale com a equipe da Alcance IA.",alternates:{canonical:"/contato"}};
export default function Page(){return <main><PageHero eyebrow="FALE COM A GENTE" title="Vamos conversar?" description="Envie dúvidas, solicitações sobre privacidade ou propostas. Sua mensagem será registrada com segurança."/><section className="content-section"><Container className="two-column"><div><span className="eyebrow">CONTATO</span><h2>Escolha o assunto. Nós organizamos o próximo passo.</h2><p>Use o formulário para que sua mensagem chegue com o contexto certo. Não envie senhas, documentos ou dados sensíveis.</p><div className="bullet-list"><span>E-mail: {siteConfig.contactEmail}</span><span>Privacidade e dados: selecione o assunto correspondente</span><span>Resposta pelo e-mail informado</span></div></div><div className="form-shell"><ContactForm /></div></Container></section></main>}
