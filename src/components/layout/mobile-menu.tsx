"use client";
import Link from "next/link";
import { useState } from "react";
import { mainNavigation } from "@/config/site";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  return <div className="mobile-menu"><button className="menu-trigger" aria-expanded={open} aria-controls="mobile-navigation" onClick={() => setOpen(!open)}><span className="sr-only">Abrir menu</span><span /><span /></button>
    {open && <nav id="mobile-navigation" className="mobile-nav" aria-label="Navegação móvel">{mainNavigation.map((item) => <Link onClick={() => setOpen(false)} key={item.href} href={item.href}>{item.label}</Link>)}<Link href="/contato">Contato</Link><Link href="/login">Entrar</Link><Link className="button" href="/#analisar">Analisar perfil</Link></nav>}
  </div>;
}
