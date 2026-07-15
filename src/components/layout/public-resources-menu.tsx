"use client";

import { useEffect, useRef, useState } from "react";
import { AnalyticsLink } from "@/components/analytics/analytics-link";
import { resourceNavigation } from "@/config/site";

export function PublicResourcesMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideInteraction = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideInteraction);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideInteraction);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return <div className="public-resources-menu" ref={menuRef}>
    <button type="button" aria-expanded={open} aria-controls="public-resources-dropdown" onClick={() => setOpen((value) => !value)}>
      Recursos
      <svg aria-hidden="true" viewBox="0 0 16 16"><path d="m4 6 4 4 4-4" /></svg>
    </button>
    {open && <div id="public-resources-dropdown" className="public-resources-dropdown">
      <header><span>FERRAMENTAS</span><strong>Recursos da Alcance IA</strong></header>
      <AnalyticsLink className="public-resource-overview" href="/recursos" eventName="navigation_clicked" properties={{ navigation_target: "/recursos", cta_location: "header_resources" }} onClick={() => setOpen(false)}>Ver todos os recursos <span aria-hidden="true">→</span></AnalyticsLink>
      {resourceNavigation.map((item) => <AnalyticsLink key={item.href} href={item.href} eventName="navigation_clicked" properties={{ navigation_target: item.href, cta_location: "header_resources" }} onClick={() => setOpen(false)}><strong>{item.label}</strong><small>{item.description}</small></AnalyticsLink>)}
    </div>}
  </div>;
}
