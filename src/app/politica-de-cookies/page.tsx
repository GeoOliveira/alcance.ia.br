import type { Metadata } from "next";
import { LegalPageLayout } from "@/components/legal/legal-page-layout";

export const metadata: Metadata = { title: "Política de Cookies", description: "Entenda e controle as categorias de cookies da Alcance IA.", alternates: { canonical: "/politica-de-cookies" } };

export default function Page() {
  return <LegalPageLayout title="Política de Cookies" intro="Você escolhe quais tecnologias não essenciais podem operar neste dispositivo.">
    <h2>1. O que são cookies</h2><p>Cookies e tecnologias semelhantes armazenam ou acessam pequenas informações no dispositivo para permitir funcionamento, lembrar preferências e, mediante consentimento, medir uso e campanhas.</p>
    <h2>2. Categorias</h2><h3>Essenciais</h3><p>Necessários para segurança, funcionamento, prevenção de abuso e registro das escolhas de consentimento. Não podem ser desativados pelo painel.</p><h3>Funcionais</h3><p>Lembram escolhas úteis e personalizam aspectos não essenciais da experiência.</p><h3>Analíticos</h3><p>Ajudam a compreender uso e desempenho. Google Analytics 4, Microsoft Clarity, Vercel Web Analytics e Speed Insights só são carregados após consentimento analítico e quando aplicável.</p><h3>Marketing</h3><p>Podem medir campanhas em plataformas externas. Não são carregados antes da autorização específica e permanecem inativos nesta versão.</p>
    <h2>3. Como gerenciar</h2><p>Use “Preferências de cookies” no rodapé para reabrir o painel a qualquer momento. Você pode aceitar tudo, rejeitar categorias não essenciais ou selecionar categorias individualmente. A revogação interrompe novos eventos e vale para usos futuros neste dispositivo; dados já recebidos por provedores seguem suas políticas de retenção.</p>
    <h2>4. Provedores</h2><p>GA4 é o provedor principal de eventos e o Clarity é opcional, com formulários mascarados. Vercel Web Analytics e Speed Insights medem uso e desempenho. Meta Pixel, Pinterest Tag e Reddit Pixel estão apenas preparados para avaliação futura e não são carregados.</p>
    <h2>5. Prazo e atualizações</h2><p>A escolha versionada e seu timestamp são armazenados localmente e poderão ser solicitados novamente após mudanças relevantes. Identificadores vazios não ativam ferramentas.</p>
    <h2 id="contato-legal">6. Dúvidas</h2><p>Envie sua pergunta pela página de contato, selecionando “Privacidade e dados”.</p>
  </LegalPageLayout>;
}
