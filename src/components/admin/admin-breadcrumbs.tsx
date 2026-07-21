"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const labels: Record<string, string> = {
  solicitacoes: "Solicitações", contatos: "Contatos", conteudo: "Conteúdo", home: "Home",
  faq: "Perguntas e respostas", paginas: "Páginas e SEO", configuracoes: "Configurações", funcionalidades: "Funcionalidades",
  usuarios: "Usuários", auditoria: "Auditoria", perfil: "Meu perfil",
};

export function AdminBreadcrumbs() {
  const segments = usePathname().split("/").filter(Boolean).slice(1);
  if (!segments.length) return <span className="admin-breadcrumbs">Visão geral</span>;
  const breadcrumbs = segments.map((segment, index) => ({
    segment,
    href: `/admin/${segments.slice(0, index + 1).join("/")}`,
  }));
  return <nav className="admin-breadcrumbs" aria-label="Navegação estrutural"><Link href="/admin">Visão geral</Link>{breadcrumbs.map(({ segment, href }, index) => {
    const last = index === segments.length - 1;
    const label = labels[segment] || (segment.length > 16 ? "Detalhe" : segment);
    return <span key={href}>/ {last ? label : <Link href={href}>{label}</Link>}</span>;
  })}</nav>;
}
