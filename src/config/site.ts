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
  { href: "/recursos", label: "Recursos" },
  { href: "/quem-somos", label: "Quem somos" },
] as const;
