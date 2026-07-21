import type { Metadata } from "next";
import { EventTracker } from "@/components/analytics/event-tracker";
import { GeneratorForm } from "@/components/whatsapp-link-generator/generator-form";
import { siteConfig } from "@/config/site";
import { generatePageMetadata } from "@/lib/seo/generate-page-metadata";
import { getWhatsAppGeneratorConfig } from "@/lib/whatsapp/resource-config";
import styles from "@/components/whatsapp-link-generator/whatsapp-generator.module.css";
import { getShortenerRequestAccess } from "@/lib/integrations/encurta/runtime";

const faqs = [
  ["O que é um link do WhatsApp?", "É um endereço oficial wa.me que abre uma conversa com um número e pode incluir uma mensagem pronta."],
  ["Preciso salvar o número para iniciar a conversa?", "Não. Ao abrir o link, o WhatsApp inicia o contato diretamente com o número informado."],
  ["A ferramenta envia mensagens automaticamente?", "Não. Ela apenas abre a conversa. Você revisa e envia a mensagem no WhatsApp."],
  ["Meu número será armazenado?", "O link oficial é gerado no seu dispositivo. Quando o encurtador estiver ativo, telefone e mensagem são transmitidos com segurança ao Encurta.io para criar e manter o redirecionamento. Analytics registram somente eventos agregados."],
  ["Posso adicionar uma mensagem pronta?", "Sim. A mensagem é opcional e aparece preenchida quando a conversa é aberta."],
  ["Posso usar o link na bio do Instagram?", "Sim. Você pode usá-lo em bios, sites, landing pages, e-mails e outros canais que aceitem links."],
  ["O link funciona no celular e no computador?", "Sim, desde que o dispositivo consiga acessar o WhatsApp ou WhatsApp Web."],
  ["O link já será encurtado?", "Quando a integração estiver disponível para seu nível de acesso, a ferramenta tenta criar automaticamente uma versão curta no Encurta.io e mantém o link oficial como alternativa."],
  ["Posso editar a mensagem depois?", "Sim. Edite o texto no formulário e gere o link novamente."],
  ["A ferramenta é gratuita?", "A configuração inicial é pública e gratuita, e pode ser alterada administrativamente no futuro."],
] as const;

export async function generateMetadata(): Promise<Metadata> {
  const config = await getWhatsAppGeneratorConfig();
  return generatePageMetadata("whatsapp_link_generator", {
    robots: { index: config.access.allowed && config.indexable, follow: true },
  });
}

export default async function WhatsAppLinkGeneratorPage() {
  const shortenerAccess = await getShortenerRequestAccess();
  const config = await getWhatsAppGeneratorConfig(shortenerAccess.level);
  if (!config.access.allowed) return <main className={`${styles.page} ${styles.unavailable}`}><div><span className={styles.eyebrow}>RECURSO INDISPONÍVEL</span><h1>Gerador de Link WhatsApp Curto</h1><p>{config.unavailableMessage}</p></div></main>;

  const structuredData = [
    { "@context": "https://schema.org", "@type": "WebApplication", name: "Gerador de Link WhatsApp Curto", applicationCategory: "UtilitiesApplication", operatingSystem: "Web", url: `${siteConfig.url}/recursos/gerador-link-whatsapp`, description: "Crie um link oficial do WhatsApp para um número brasileiro com mensagem opcional.", offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" } },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Início", item: siteConfig.url }, { "@type": "ListItem", position: 2, name: "Recursos", item: `${siteConfig.url}/recursos` }, { "@type": "ListItem", position: 3, name: "Gerador de Link WhatsApp Curto", item: `${siteConfig.url}/recursos/gerador-link-whatsapp` }] },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } })) },
  ];
  const steps = [["01", "Informe seu número", "Digite o DDD e o telefone vinculado ao WhatsApp."], ["02", "Escreva uma mensagem", "Adicione uma mensagem que será preenchida automaticamente ao abrir a conversa."], ["03", "Copie e compartilhe", "Use o link em sua bio, site, anúncios, e-mails ou redes sociais."]] as const;
  const benefits = [["↗", "Menos etapas", "Pode facilitar o início da conversa sem exigir que a pessoa salve o número."], ["✦", "Mensagem pré-preenchida", "Padronize o primeiro contato com um texto útil e editável."], ["◎", "Vários canais", "Leve o mesmo ponto de contato para sites, perfis, campanhas e materiais digitais."], ["◇", "Experiência direta", "Um link claro ajuda o visitante a entender qual será a próxima ação."]] as const;
  const uses = [["◎", "Bio do Instagram", "Direcione o link principal do perfil para o atendimento."], ["♪", "Perfil do TikTok", "Ofereça uma forma direta de pedir informações."], ["⌂", "Site e landing page", "Use em botões de contato, orçamento ou suporte."], ["▤", "Catálogo", "Associe um link a produtos ou serviços apresentados."], ["✉", "E-mail", "Inclua na assinatura ou em uma campanha autorizada."], ["▱", "Cartão digital", "Transforme o telefone em uma ação fácil de tocar."], ["↗", "Campanhas", "Leve interessados para uma conversa contextualizada."], ["◌", "Atendimento", "Compartilhe um canal simples para tirar dúvidas."], ["$", "Orçamento", "Use uma mensagem pronta para identificar a solicitação."], ["#", "Redes sociais", "Aproveite canais que aceitam links clicáveis."]] as const;

  return <main className={styles.page}>
    <EventTracker name="whatsapp_generator_viewed" properties={{ status: "available", access_level: config.feature.audience }} options={{ dedupeKey: "whatsapp_generator_viewed", dedupeWindowMs: 30000 }} />
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
    <section className={styles.hero}><div className={`${styles.container} ${styles.heroGrid}`}>
      <div className={styles.heroCopy}><span className={styles.eyebrow}>FERRAMENTA GRATUITA</span><h1>{config.content.hero_title}</h1><p className={styles.lead}>{config.content.hero_description}</p><ul className={styles.benefitList}><li>Não precisa instalar nada</li><li>Não exige cadastro</li><li>Gera link gratuitamente</li><li>Funciona em sites e redes sociais</li><li>Não solicita sua senha</li></ul><div className={styles.trust}><span aria-hidden="true">◇</span><div><strong>Privacidade desde a origem</strong><br />{config.content.hero_notice}</div></div></div>
      <GeneratorForm flags={config.flags} messageMaxCharacters={config.messageMaxCharacters} accessLevel={shortenerAccess.level === "anonymous" ? "public" : shortenerAccess.level === "admin" ? "admin" : shortenerAccess.level} />
    </div></section>
    <section className={styles.section}><div className={styles.container}><div className={styles.sectionHeading}><span>TRÊS PASSOS</span><h2>{config.content.how_it_works_title}</h2><p>O resultado usa o endereço oficial wa.me e fica pronto para copiar, testar e compartilhar.</p></div><div className={styles.steps}>{steps.map(([number,title,text])=><article className={`${styles.card}`} key={number}><span className={styles.number}>{number}</span><h3>{title}</h3><p>{text}</p></article>)}</div></div></section>
    <section className={`${styles.section} ${styles.sectionAlt}`}><div className={styles.container}><div className={styles.sectionHeading}><span>POR QUE USAR</span><h2>{config.content.benefits_title}</h2><p>Um link direto pode reduzir atrito e deixar mais claro como falar com você — sem promessas artificiais de resultado.</p></div><div className={styles.benefitGrid}>{benefits.map(([icon,title,text])=><article className={styles.card} key={title}><span className={styles.cardIcon} aria-hidden="true">{icon}</span><div><h3>{title}</h3><p>{text}</p></div></article>)}</div></div></section>
    <section className={styles.section}><div className={styles.container}><div className={styles.sectionHeading}><span>IDEIAS DE USO</span><h2>{config.content.use_cases_title}</h2><p>Copie o link e publique apenas nos canais em que você deseja receber contatos.</p></div><div className={styles.useGrid}>{uses.map(([icon,title,text])=><article className={styles.card} key={title}><span className={styles.cardIcon} aria-hidden="true">{icon}</span><h3>{title}</h3><p>{text}</p><small>Exemplo: botão “Fale conosco”.</small></article>)}</div></div></section>
    <section className={`${styles.section} ${styles.sectionAlt}`}><div className={`${styles.container} ${styles.privacy}`}><div className={styles.privacyVisual} aria-hidden="true"><div className={styles.illustrationGlow} /><div className={`${styles.privacyOrb} ${styles.privacyOrbOne}`}>✦</div><div className={`${styles.privacyOrb} ${styles.privacyOrbTwo}`}>↗</div><div className={styles.privacyPhone}><div className={styles.phoneHeader}><span className={styles.phoneAvatar}>A</span><span className={styles.phoneSignal} /></div><div className={styles.phoneLine} /><div className={`${styles.messageBubble} ${styles.messageBubbleLight}`}>Olá! Tudo certo?</div><div className={`${styles.messageBubble} ${styles.messageBubbleBlue}`}><span className={styles.linkMark}>↗</span><span><small>LINK DIRETO</small><strong>wa.me/55...</strong></span></div><div className={styles.privacyBadge}><svg viewBox="0 0 24 24"><path d="M7.5 10V8a4.5 4.5 0 0 1 9 0v2M6 10h12v9H6z" /><path d="m9.5 14 1.7 1.7 3.5-3.5" /></svg><span>sob seu controle</span></div></div></div><div><div className={styles.sectionHeading}><span>PRIVACIDADE E SEGURANÇA</span><h2>{config.content.privacy_title}</h2><p>{config.content.privacy_description}</p></div><ul className={styles.privacyList}><li>Não solicita senha do WhatsApp</li><li>Não acessa suas conversas</li><li>Não envia mensagens automaticamente</li><li>O Encurta.io recebe somente os dados necessários quando o link curto é solicitado</li><li>Você escolhe onde compartilhar</li></ul></div></div></section>
    <section className={styles.section}><div className={`${styles.container} ${styles.faq}`}><div className={styles.sectionHeading}><span>DÚVIDAS FREQUENTES</span><h2>Perguntas sobre o link do WhatsApp</h2></div>{faqs.map(([question,answer])=><details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></section>
    <section className={styles.finalCta}><div className={`${styles.container} ${styles.finalCtaInner}`}><div><h2>{config.content.final_cta_title}</h2><p>{config.content.final_cta_description}</p></div><a href="#gerador">{config.content.final_cta_button} ↑</a></div></section>
  </main>;
}
