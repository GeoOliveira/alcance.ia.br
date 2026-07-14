"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { CONSENT_KEY, defaultConsent, parseConsent, type CookieConsent } from "@/lib/cookies/consent";
import { trackEvent } from "@/lib/analytics/events";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [choices, setChoices] = useState(() => defaultConsent());
  const titleRef = useRef<HTMLHeadingElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const stored = parseConsent(localStorage.getItem(CONSENT_KEY));
      if (stored) setChoices(stored); else {
        returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        setVisible(true);
      }
    });
    const open = () => {
      returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      setVisible(true);
      setCustomizing(true);
    };
    window.addEventListener("alcance:open-cookies", open);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("alcance:open-cookies", open); };
  }, []);

  useEffect(() => {
    if (!visible) return;
    titleRef.current?.focus();
  }, [visible, customizing]);

  function save(consent: CookieConsent) {
    const next = { ...consent, essential: true as const, updatedAt: new Date().toISOString() };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(next));
    setChoices(next); setVisible(false); setCustomizing(false);
    trackEvent("cookie_consent_updated", { analytics: next.analytics, marketing: next.marketing });
    returnFocusRef.current?.focus();
  }

  function keepFocusInside(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled])',
      ),
    ).filter((element) => element.offsetParent !== null);
    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first || !last) return;
    if (event.shiftKey && (document.activeElement === first || document.activeElement === titleRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  if (!visible) return null;
  return <div className="cookie-shell" role="dialog" aria-modal="true" aria-labelledby="cookie-title" aria-describedby="cookie-description" onKeyDown={keepFocusInside}><div className="cookie-card"><div><span className="eyebrow">Sua escolha importa</span><h2 ref={titleRef} tabIndex={-1} id="cookie-title">Cookies com transparência</h2><p id="cookie-description">Usamos cookies essenciais para o site funcionar. Os demais só serão ativados com a sua permissão. <Link href="/politica-de-cookies">Saiba mais</Link>.</p></div>
    {customizing && <div className="cookie-options"><CookieToggle label="Essenciais" description="Necessários para segurança e preferências." checked disabled /><CookieToggle label="Funcionais" description="Lembram escolhas úteis no dispositivo." checked={choices.functional} onChange={(v) => setChoices({ ...choices, functional: v })} /><CookieToggle label="Analíticos" description="Ajudam a entender o uso do site." checked={choices.analytics} onChange={(v) => setChoices({ ...choices, analytics: v })} /><CookieToggle label="Marketing" description="Medição futura de campanhas." checked={choices.marketing} onChange={(v) => setChoices({ ...choices, marketing: v })} /></div>}
    <div className="cookie-actions">{!customizing && <button className="button button-ghost" onClick={() => setCustomizing(true)}>Configurar</button>}<button className="button button-ghost" onClick={() => save(defaultConsent())}>Rejeitar não essenciais</button>{customizing ? <button className="button" onClick={() => save(choices)}>Salvar preferências</button> : <button className="button" onClick={() => save({ ...defaultConsent(), functional: true, analytics: true, marketing: true })}>Aceitar todos</button>}</div></div></div>;
}

function CookieToggle({ label, description, checked, disabled = false, onChange }: { label: string; description: string; checked: boolean; disabled?: boolean; onChange?: (value: boolean) => void }) {
  return <label className="cookie-toggle"><span><strong>{label}</strong><small>{description}</small></span><input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange?.(e.target.checked)} /></label>;
}
