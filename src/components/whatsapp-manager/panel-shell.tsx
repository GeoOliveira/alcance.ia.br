"use client";

import Link from "next/link";
import { useState } from "react";
import { logoutUserAction } from "@/app/(user-auth)/actions";
import { LogoutButton } from "./logout-button";
import { PanelNav, PanelTabs } from "./panel-nav";

export function PanelShell({ children, name, email }: { children: React.ReactNode; name: string; email: string }) {
  const [collapsed, setCollapsed] = useState(true);
  return <div className="panel-shell" data-collapsed={collapsed}>
    <aside className="panel-sidebar">
      <div className="panel-sidebar-head"><Link href="/painel" className="panel-brand"><span>AI</span><strong>Links WhatsApp</strong></Link><button type="button" className="panel-collapse" aria-label={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"} aria-expanded={!collapsed} onClick={() => setCollapsed((value) => !value)}><i aria-hidden="true">{collapsed ? "›" : "‹"}</i></button></div>
      <span className="panel-nav-label">ESPAÇO DE TRABALHO</span>
      <PanelNav collapsed={collapsed} />
      <div className="panel-profile"><div>{name.slice(0, 1).toUpperCase()}</div><span><strong>{name}</strong><small>{email}</small></span><form action={logoutUserAction}><LogoutButton /></form></div>
    </aside>
    <div className="panel-workspace">
      <header className="panel-topbar"><div className="panel-topbar-title"><span>GERENCIADOR</span><strong>Links WhatsApp</strong></div><PanelTabs /><Link href="/painel/links/novo" className="panel-primary panel-new-link">+ Criar link</Link></header>
      <main className="panel-content">{children}</main>
    </div>
  </div>;
}
