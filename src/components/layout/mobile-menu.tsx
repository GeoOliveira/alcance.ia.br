"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { mainNavigation } from "@/config/site";

export function MobileMenu() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  const close = () => setOpen(false);
  const label = open ? "Fechar menu" : "Abrir menu";

  return <div className="mobile-menu"><button type="button" className="menu-trigger" aria-expanded={open} aria-controls="mobile-navigation" aria-label={label} onClick={() => setOpen(!open)}><span aria-hidden="true" /><span aria-hidden="true" /></button>
    {open && <nav id="mobile-navigation" className="mobile-nav" aria-label="Navegação móvel">{mainNavigation.map((item) => <Link onClick={close} key={item.href} href={item.href}>{item.label}</Link>)}<Link onClick={close} href="/contato">Contato</Link><Link onClick={close} href="/login">Entrar</Link><Link onClick={close} className="button" href="/#analisar">Analisar perfil</Link></nav>}
  </div>;
}
