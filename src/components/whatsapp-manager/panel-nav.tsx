"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ManagerIcon } from "./icons";

const tabs = [
  { href: "/painel", label: "Visão geral" },
  { href: "/painel/links", label: "Meus links" },
  { href: "/painel/links/novo", label: "Novo link" },
  { href: "/painel/qr-codes", label: "QR Codes" },
] as const;

export function PanelNav({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  const accountActive = pathname.startsWith("/painel/conta") || pathname.startsWith("/painel/seguranca");
  const [accountOpen, setAccountOpen] = useState(accountActive);
  return <nav className="panel-nav" aria-label="Navegação do painel">
    <Link href="/painel" title="Links WhatsApp" className={!accountActive ? "is-active" : ""}><ManagerIcon name="link" /><span>Links WhatsApp</span></Link>
    <div className="panel-nav-account">
      <button type="button" title="Minha conta" aria-expanded={!collapsed && accountOpen} className={accountActive ? "is-active" : ""} onClick={() => setAccountOpen((value) => !value)}><ManagerIcon name="user" /><span>Minha conta</span><i aria-hidden="true">⌄</i></button>
      {!collapsed && accountOpen ? <div className="panel-nav-submenu"><Link href="/painel/conta" className={pathname === "/painel/conta" ? "is-active" : ""}>Perfil e preferências</Link><Link href="/painel/seguranca" className={pathname === "/painel/seguranca" ? "is-active" : ""}>Segurança</Link></div> : null}
    </div>
  </nav>;
}

export function PanelTabs() {
  const pathname = usePathname();
  return <nav className="panel-tabs" aria-label="Seções de Links WhatsApp">{tabs.map((tab) => {
    const active = tab.href === "/painel" ? pathname === tab.href : tab.href === "/painel/links" ? pathname === tab.href || /^\/painel\/links\/[0-9a-f-]+(?:\/.*)?$/i.test(pathname) : pathname.startsWith(tab.href);
    return <Link key={tab.href} href={tab.href} aria-current={active ? "page" : undefined}>{tab.label}</Link>;
  })}</nav>;
}
