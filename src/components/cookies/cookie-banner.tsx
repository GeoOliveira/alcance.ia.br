"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CONSENT_KEY, defaultConsent, parseConsent, type CookieConsent } from "@/lib/cookies/consent";
import { trackEvent } from "@/lib/analytics/events";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [choices, setChoices] = useState(() => defaultConsent());
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const stored = parseConsent(localStorage.getItem(CONSENT_KEY));
      if (stored) setChoices(stored); else setVisible(true);
    });
    const open = () => { setVisible(true); setCustomizing(true); };
    window.addEventListener("alcance:open-cookies", open);
    return () => { cancelAnimationFrame(frame); window.removeEventListener("alcance:open-cookies", open); };
  }, []);

  function save(consent: CookieConsent) {
    const next = { ...consent, essential: true as const, updatedAt: new Date().toISOString() };
    localStorage.setItem(CONSENT_KEY, JSON.stringify(next));
    setChoices(next); setVisible(false); setCustomizing(false);
    trackEvent("cookie_consent_updated", { analytics: next.analytics, marketing: next.marketing });
  }
  if (!visible) return null;
  return <div className="cookie-shell" role="dialog" aria-modal="true" aria-labelledby="cookie-title"><div className="cookie-card"><div><span className="eyebrow">Sua escolha importa</span><h2 id="cookie-title">Cookies com transparência</h2><p>Usamos cookies essenciais para o site funcionar. Os demais só serão ativados com a sua permissão. <Link href="/politica-de-cookies">Saiba mais</Link>.</p></div>
    {customizing && <div className="cookie-options"><CookieToggle label="Essenciais" description="Necessários para segurança e preferências." checked disabled /><CookieToggle label="Funcionais" description="Lembram escolhas úteis no dispositivo." checked={choices.functional} onChange={(v) => setChoices({ ...choices, functional: v })} /><CookieToggle label="Analíticos" description="Ajudam a entender o uso do site." checked={choices.analytics} onChange={(v) => setChoices({ ...choices, analytics: v })} /><CookieToggle label="Marketing" description="Medição futura de campanhas." checked={choices.marketing} onChange={(v) => setChoices({ ...choices, marketing: v })} /></div>}
    <div className="cookie-actions">{!customizing && <button className="button button-ghost" onClick={() => setCustomizing(true)}>Configurar</button>}<button className="button button-ghost" onClick={() => save(defaultConsent())}>Rejeitar não essenciais</button>{customizing ? <button className="button" onClick={() => save(choices)}>Salvar preferências</button> : <button className="button" onClick={() => save({ ...defaultConsent(), functional: true, analytics: true, marketing: true })}>Aceitar todos</button>}</div></div></div>;
}

function CookieToggle({ label, description, checked, disabled = false, onChange }: { label: string; description: string; checked: boolean; disabled?: boolean; onChange?: (value: boolean) => void }) {
  return <label className="cookie-toggle"><span><strong>{label}</strong><small>{description}</small></span><input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange?.(e.target.checked)} /></label>;
}
