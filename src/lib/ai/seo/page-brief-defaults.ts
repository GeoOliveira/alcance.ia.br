import type { PageKey } from "@/lib/seo/types";

export type PageSeoBriefDefault = {
  purpose: string;
  audience: string;
  searchIntent: string;
  primaryKeyword: string;
  differentiators: string[];
};

export const pageSeoBriefDefaults: Record<PageKey, PageSeoBriefDefault> = {
  home: { purpose: "Apresentar a Alcance IA e conduzir à análise de um perfil público do Instagram.", audience: "Criadores, marcas e profissionais de social media.", searchIntent: "Conhecer e experimentar uma análise de Instagram.", primaryKeyword: "análise de Instagram", differentiators: ["dados públicos", "métricas transparentes", "recomendações práticas"] },
  about: { purpose: "Explicar a visão, os princípios e a responsabilidade da Alcance IA.", audience: "Pessoas avaliando a credibilidade da plataforma.", searchIntent: "Conhecer a Alcance IA.", primaryKeyword: "Alcance IA", differentiators: ["transparência", "privacidade", "uso responsável de IA"] },
  how_it_works: { purpose: "Explicar de forma simples como a análise é solicitada, processada e apresentada.", audience: "Pessoas interessadas em usar a plataforma.", searchIntent: "Entender como funciona a análise de Instagram.", primaryKeyword: "como analisar Instagram", differentiators: ["fluxo transparente", "dados públicos", "métricas explicadas"] },
  resources: { purpose: "Apresentar os recursos disponíveis na plataforma.", audience: "Criadores, marcas e profissionais de conteúdo.", searchIntent: "Encontrar ferramentas para Instagram.", primaryKeyword: "ferramentas para Instagram", differentiators: ["recursos organizados", "dados públicos", "metodologia transparente"] },
  contact: { purpose: "Facilitar o contato com a equipe da Alcance IA.", audience: "Usuários, parceiros e interessados na plataforma.", searchIntent: "Entrar em contato com a Alcance IA.", primaryKeyword: "contato Alcance IA", differentiators: ["canal direto", "atendimento responsável"] },
  privacy_policy: { purpose: "Informar como dados pessoais são tratados e protegidos.", audience: "Usuários e titulares de dados.", searchIntent: "Consultar a política de privacidade da Alcance IA.", primaryKeyword: "política de privacidade Alcance IA", differentiators: ["clareza", "proteção de dados", "direitos do titular"] },
  terms: { purpose: "Apresentar as condições de uso responsável da plataforma.", audience: "Usuários da Alcance IA.", searchIntent: "Consultar os termos de uso da Alcance IA.", primaryKeyword: "termos de uso Alcance IA", differentiators: ["uso responsável", "regras claras"] },
  cookies_policy: { purpose: "Explicar as categorias e o controle de cookies.", audience: "Visitantes do site.", searchIntent: "Consultar a política de cookies da Alcance IA.", primaryKeyword: "política de cookies Alcance IA", differentiators: ["controle", "transparência", "preferências"] },
  data_deletion: { purpose: "Orientar a solicitação de exclusão de dados.", audience: "Titulares de dados e usuários.", searchIntent: "Solicitar exclusão de dados na Alcance IA.", primaryKeyword: "exclusão de dados Alcance IA", differentiators: ["processo claro", "direitos do titular"] },
  hashtags: { purpose: "Ajudar a explorar hashtags relacionadas com contexto e metodologia.", audience: "Criadores e profissionais de social media.", searchIntent: "Encontrar hashtags relacionadas para Instagram.", primaryKeyword: "hashtags para Instagram", differentiators: ["relações úteis", "metodologia transparente"] },
  trending_reels: { purpose: "Apresentar tendências de Reels a partir de dados públicos.", audience: "Criadores, marcas e profissionais de conteúdo.", searchIntent: "Descobrir Reels em alta.", primaryKeyword: "Reels em alta", differentiators: ["dados públicos", "contexto das tendências"] },
  category_reels: { purpose: "Organizar referências de Reels por categoria editorial.", audience: "Criadores e equipes de conteúdo.", searchIntent: "Encontrar Reels por categoria.", primaryKeyword: "Reels por categoria", differentiators: ["organização editorial", "descoberta de conteúdo"] },
  branded_content: { purpose: "Permitir a pesquisa de conteúdo de marca público com filtros.", audience: "Marcas, criadores e profissionais de marketing.", searchIntent: "Pesquisar conteúdo de marca no Instagram.", primaryKeyword: "conteúdo de marca Instagram", differentiators: ["fontes identificadas", "filtros", "dados públicos"] },
  whatsapp_link_generator: { purpose: "Permitir a criação de um link oficial do WhatsApp com mensagem opcional.", audience: "Profissionais, pequenos negócios e pessoas que divulgam um canal de atendimento.", searchIntent: "Criar um link direto para WhatsApp.", primaryKeyword: "gerador de link WhatsApp", differentiators: ["gratuito", "sem cadastro", "processamento local", "número brasileiro"] },
  whatsapp_link_manager: { purpose: "Apresentar o painel de criação, organização, QR Codes e métricas de links do WhatsApp.", audience: "Negócios e profissionais que administram canais de atendimento.", searchIntent: "Gerenciar links curtos do WhatsApp.", primaryKeyword: "gerenciador de links WhatsApp", differentiators: ["links Encurta.io", "QR Code local", "métricas agregadas", "controle por conta"] },
};
