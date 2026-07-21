export const siteConfig = {
  name: "Alcance IA",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://alcance.ia.br",
  description:
    "Tecnologia brasileira para interpretar perfis, conteúdo e oportunidades no Instagram com clareza e responsabilidade.",
  contactEmail: process.env.CONTACT_EMAIL || "contato@alcance.ia.br",
  legal: {
    companyName: "[NOME EMPRESARIAL A DEFINIR]",
    document: "[CNPJ A DEFINIR]",
    address: "[ENDEREÇO A DEFINIR]",
    privacyOfficer: "[ENCARREGADO(A) A DEFINIR]",
  },
} as const;

export const mainNavigation = [
  { href: "/como-funciona", label: "Como funciona" },
  { href: "/quem-somos", label: "Quem somos" },
] as const;

export const resourceNavigation = [
  { href: "/recursos/hashtags", label: "Hashtags", description: "Descubra hashtags recorrentes e em crescimento." },
  { href: "/recursos/reels-em-alta", label: "Reels em alta", description: "Acompanhe conteúdos com sinais de destaque." },
  { href: "/recursos/reels-por-categoria", label: "Reels por categoria", description: "Explore referências organizadas por segmento." },
  { href: "/recursos/conteudo-de-marca", label: "Conteúdo de marca", description: "Pesquise parcerias declaradas entre marcas e criadores." },
  { href: "/recursos/gerador-link-whatsapp", label: "Gerador de Link WhatsApp", description: "Gere gratuitamente um link do WhatsApp com mensagem personalizada." },
  { href: "/recursos/gerenciador-links-whatsapp", label: "Gerenciador de Link WhatsApp", description: "Crie links curtos, QR Codes e acompanhe os acessos." },
] as const;

export type ResourceNavigationItem = { href: string; label: string; description: string };
