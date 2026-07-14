import Link from "next/link";
import { Container } from "@/components/ui/container";
import { HeroAnalysisForm } from "@/components/forms/hero-analysis-form";
import { ReportPreview } from "@/components/sections/report-preview";
import { FAQAccordion } from "@/components/sections/faq";

const benefits = [
  ["◎", "Clareza antes da ação", "Organize sinais do seu perfil em uma leitura simples, sem promessas vagas."],
  ["⌁", "Decisões mais conscientes", "Enxergue pontos de atenção para priorizar o que realmente merece esforço."],
  ["✦", "IA como apoio", "Receba orientação assistiva, mantendo contexto, autoria e decisão com você."],
];
const resources = ["Leitura da bio", "Consistência editorial", "Interpretação de métricas", "Oportunidades de conteúdo", "Recomendações práticas", "Ideias para publicações"];
const faqs = [
  { question: "A Alcance IA pede minha senha do Instagram?", answer: "Não. Nunca solicitamos a senha do Instagram. A proposta utiliza somente informações públicas ou dados que você autorize de forma explícita." },
  { question: "A análise completa já está disponível?", answer: "Ainda não. Esta primeira versão demonstra o formato da experiência e registra solicitações. A integração real será implementada em uma próxima fase." },
  { question: "Os dados mostrados na prévia são do meu perfil?", answer: "Não. A prévia é claramente ilustrativa e não associa métricas inventadas ao perfil informado." },
  { question: "A plataforma garante crescimento?", answer: "Não. A Alcance IA pretende apoiar decisões, mas não garante alcance, engajamento, crescimento ou qualquer resultado específico." },
];

export default function Home() {
  const faqJson = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((item) => ({ "@type": "Question", name: item.question, acceptedAnswer: { "@type": "Answer", text: item.answer } })) };
  return <main><section className="hero" id="analisar"><Container className="hero-grid"><div className="hero-copy"><div className="status-chip"><span /> Primeira versão em desenvolvimento</div><h1>Entenda seu perfil.<br /><em>Amplie suas possibilidades.</em></h1><p className="hero-lead">Analise seu perfil do Instagram e descubra oportunidades para melhorar sua bio, seu conteúdo e seu engajamento.</p><HeroAnalysisForm /><div className="trust-inline"><span>✓ Sem senha</span><span>✓ Sem compromisso</span><span>✓ Privacidade desde o início</span></div></div><div className="hero-visual" aria-label="Representação visual de uma análise organizada"><div className="visual-glow" /><div className="profile-card"><div className="profile-head"><div className="avatar-placeholder">@</div><div><strong>seu perfil</strong><span>Leitura preparada com clareza</span></div><i>•••</i></div><div className="profile-lines"><span /><span /><span /></div><div className="signal-row"><div><b>01</b><small>bio</small></div><div><b>02</b><small>conteúdo</small></div><div><b>03</b><small>oportunidades</small></div></div></div><div className="insight-float"><span>✦</span><div><strong>Próximo passo</strong><small>Transforme sinais em decisões</small></div></div><div className="orb orb-one" /><div className="orb orb-two" /></div></Container></section>

    <section className="trust-strip"><Container><p>Uma experiência criada para ser</p><div><span>Transparente</span><i>•</i><span>Responsável</span><i>•</i><span>Útil</span><i>•</i><span>Brasileira</span></div></Container></section>

    <section className="section report-section"><Container><div className="split-heading"><div><span className="eyebrow">O RELATÓRIO</span><h2>Informação organizada.<br />Decisão mais simples.</h2></div><p>A proposta é reunir observações sobre seu perfil em uma experiência clara, visual e acionável — sempre distinguindo fatos, estimativas e recomendações.</p></div><ReportPreview /><p className="demo-disclaimer">A tela acima é uma demonstração visual. Nenhum dado ilustrativo corresponde ao perfil informado.</p></Container></section>

    <section className="section soft-section"><Container><div className="center-heading"><span className="eyebrow">POR QUE USAR</span><h2>Menos ruído. Mais direção.</h2><p>Uma forma mais leve de compreender sua presença digital.</p></div><div className="benefit-grid">{benefits.map(([icon, title, text]) => <article key={title}><span>{icon}</span><h3>{title}</h3><p>{text}</p></article>)}</div></Container></section>

    <section className="section"><Container><div className="how-grid"><div className="sticky-copy"><span className="eyebrow">COMO FUNCIONA</span><h2>Do perfil à próxima ideia, em um fluxo simples.</h2><p>Nesta primeira fase, você experimenta o início da jornada com total transparência sobre o que já está disponível.</p><Link className="arrow-link" href="/como-funciona">Conheça o processo completo →</Link></div><div className="steps-list"><Step number="01" title="Informe seu perfil" text="Digite apenas o nome de usuário ou a URL pública do Instagram." /><Step number="02" title="Acompanhe a preparação" text="Organizamos sua solicitação para mostrar como será a experiência — sem afirmar que uma análise real está ocorrendo." /><Step number="03" title="Explore a demonstração" text="Veja a estrutura prevista do relatório com conteúdo claramente ilustrativo." /></div></div></Container></section>

    <section className="section dark-section"><Container><div className="split-heading light"><div><span className="eyebrow">RECURSOS EM CONSTRUÇÃO</span><h2>Uma visão que conecta os pontos.</h2></div><p>A Alcance IA está sendo preparada para apoiar diferentes dimensões da sua presença no Instagram.</p></div><div className="resource-grid">{resources.map((resource, index) => <div key={resource}><span>{String(index + 1).padStart(2, "0")}</span><h3>{resource}</h3><i>↗</i></div>)}</div><Link className="button button-light" href="/recursos">Ver todos os recursos</Link></Container></section>

    <section className="section audience-section"><Container><div className="audience-card"><div><span className="eyebrow">PARA QUEM É</span><h2>Para quem quer crescer com mais consciência.</h2><p>Criadores, profissionais autônomos e pequenos negócios que buscam interpretar melhor sua comunicação digital.</p></div><div className="audience-tags"><span>Criadores de conteúdo</span><span>Negócios locais</span><span>Profissionais autônomos</span><span>Marcas em construção</span></div></div></Container></section>

    <section className="section privacy-section"><Container><div className="privacy-grid"><div className="privacy-mark">◇<span>privacidade<br />por princípio</span></div><div><span className="eyebrow">PRIVACIDADE E SEGURANÇA</span><h2>Seus dados merecem contexto, cuidado e controle.</h2><p>Coletamos somente o necessário para cada etapa. Não pedimos credenciais de redes sociais e preparamos a plataforma com segurança no servidor, consentimento granular e princípios da LGPD.</p><div className="privacy-points"><span>✓ Dados mínimos</span><span>✓ Consentimento claro</span><span>✓ Controle de cookies</span><span>✓ Exclusão facilitada</span></div><Link className="arrow-link" href="/politica-de-privacidade">Conheça nossa política →</Link></div></div></Container></section>

    <section className="section faq-section"><Container><div className="faq-grid"><div><span className="eyebrow">DÚVIDAS FREQUENTES</span><h2>Transparência também é responder antes.</h2></div><FAQAccordion items={faqs} /></div></Container></section>

    <section className="final-cta"><Container><div><span className="eyebrow">COMECE POR AQUI</span><h2>Seu próximo passo pode começar com uma leitura melhor.</h2><p>Informe seu perfil e conheça a experiência inicial da Alcance IA.</p><Link className="button button-large" href="#analisar">Analisar meu perfil <span>→</span></Link><small>Não pedimos sua senha do Instagram.</small></div></Container></section>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJson) }} /></main>;
}

function Step({ number, title, text }: { number: string; title: string; text: string }) { return <article><span>{number}</span><div><h3>{title}</h3><p>{text}</p></div></article>; }
