"use client";
import { useEffect, useState } from "react";
import { mainNavigation } from "@/config/site";
import { AnalyticsLink } from "@/components/analytics/analytics-link";

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
    {open && <nav id="mobile-navigation" className="mobile-nav" aria-label="Navegação móvel">{mainNavigation.map((item) => <AnalyticsLink onClick={close} key={item.href} href={item.href} eventName="navigation_clicked" properties={{ navigation_target: item.href, cta_location: "mobile_menu" }}>{item.label}</AnalyticsLink>)}<AnalyticsLink onClick={close} href="/contato" eventName="navigation_clicked" properties={{ navigation_target: "/contato", cta_location: "mobile_menu" }}>Contato</AnalyticsLink><AnalyticsLink onClick={close} href="/login" eventName="login_clicked" properties={{ cta_location: "mobile_menu" }}>Entrar</AnalyticsLink><AnalyticsLink onClick={close} className="button" href="/#analisar" eventName="navigation_clicked" properties={{ navigation_target: "/#analisar", cta_location: "mobile_menu" }}>Analisar perfil</AnalyticsLink></nav>}
  </div>;
}
