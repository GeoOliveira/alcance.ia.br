"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { AdminPermission, AdminRole } from "@/types/admin";
import { hasPermission } from "@/lib/admin/permissions";

type NavigationItem = { href: string; label: string; permission: AdminPermission };

const primaryItems: NavigationItem[] = [
  { href: "/admin", label: "Visão geral", permission: "dashboard.view" },
  { href: "/admin/solicitacoes", label: "Solicitações", permission: "analysis.view" },
  { href: "/admin/contatos", label: "Contatos", permission: "contacts.view" },
  { href: "/admin/conteudo/home", label: "Conteúdo", permission: "content.manage" },
  { href: "/admin/conteudo/faq", label: "Perguntas frequentes", permission: "faq.manage" },
  { href: "/admin/configuracoes", label: "Configurações", permission: "settings.manage" },
  { href: "/admin/funcionalidades", label: "Funcionalidades", permission: "features.manage" },
  { href: "/admin/recursos", label: "Recursos do produto", permission: "features.manage" },
  { href: "/admin/categorias", label: "Categorias", permission: "features.manage" },
];
const integrationItems: NavigationItem[] = [
  { href: "/admin/integracoes/scrapecreators", label: "ScrapeCreators", permission: "provider_poc.view" },
  { href: "/admin/integracoes/openai", label: "OpenAI", permission: "ai_integration.view" },
  { href: "/admin/integracoes/turnstile", label: "Turnstile", permission: "settings.manage" },
];
const secondaryItems: NavigationItem[] = [
  { href: "/admin/usuarios", label: "Usuários", permission: "users.view" },
  { href: "/admin/auditoria", label: "Auditoria", permission: "audit.view" },
  { href: "/admin/perfil", label: "Meu perfil", permission: "dashboard.view" },
];

function NavigationLinks({ role, onNavigate }: { role: AdminRole; onNavigate?: () => void }) {
  const pathname = usePathname();
  const links = (items: NavigationItem[]) => items.filter((item) => hasPermission(role, item.permission)).map((item) => {
    const active = item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
    return <Link key={item.href} href={item.href} aria-current={active ? "page" : undefined} onClick={onNavigate}>{item.label}</Link>;
  });
  const integrations = integrationItems.filter((item) => hasPermission(role, item.permission));
  const integrationActive = pathname.startsWith("/admin/integracoes");
  return <nav aria-label="Administração">
    {links(primaryItems)}
    {integrations.length > 0 && <div className="admin-nav-group"><Link className="admin-nav-parent" href="/admin/integracoes" aria-current={pathname === "/admin/integracoes" ? "page" : undefined} data-active={integrationActive} onClick={onNavigate}><span>Integrações</span><i aria-hidden="true">⌄</i></Link><div className="admin-nav-children">{integrations.map((item) => <Link key={item.href} href={item.href} aria-current={pathname.startsWith(item.href) ? "page" : undefined} onClick={onNavigate}>{item.label}</Link>)}</div></div>}
    {links(secondaryItems)}
  </nav>;
}

export function AdminSidebar({ role }: { role: AdminRole }) {
  return <aside className="admin-sidebar"><div className="admin-brand"><span>AI</span><strong>Alcance IA</strong><small>Administração</small></div><NavigationLinks role={role} /></aside>;
}

export function AdminMobileMenu({ role }: { role: AdminRole }) {
  const [open, setOpen] = useState(false);
  return <div className="admin-mobile-menu"><button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>Menu</button>
    {open && <div className="admin-mobile-panel"><NavigationLinks role={role} onNavigate={() => setOpen(false)} /></div>}
  </div>;
}
