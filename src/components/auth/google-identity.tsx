"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type CredentialResponse = { credential?: string };
type GoogleAccounts = {
  id: {
    initialize(config: Record<string, unknown>): void;
    renderButton(element: HTMLElement, config: Record<string, unknown>): void;
    prompt(callback?: (notification: { isDismissedMoment?: () => boolean }) => void): void;
    cancel(): void;
    disableAutoSelect(): void;
  };
};
declare global { interface Window { google?: { accounts: GoogleAccounts } } }

async function noncePair() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const nonce = btoa(String.fromCharCode(...bytes));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(nonce));
  const hashed = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return { nonce, hashed };
}

export function GoogleIdentity({ enabled, oneTap = false, clientId = "" }: { enabled: boolean; oneTap?: boolean; clientId?: string }) {
  const router = useRouter();
  const button = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled || !loaded || !clientId || initialized.current || !window.google || !button.current) return;
    let active = true;
    void noncePair().then(({ nonce, hashed }) => {
      if (!active || !window.google || !button.current) return;
      initialized.current = true;
      window.google.accounts.id.initialize({
        client_id: clientId,
        nonce: hashed,
        use_fedcm_for_prompt: true,
        use_fedcm_for_button: true,
        auto_select: false,
        callback: async (response: CredentialResponse) => {
          if (!response.credential) return;
          setError("");
          const supabase = createClient();
          const { error: signInError } = await supabase.auth.signInWithIdToken({ provider: "google", token: response.credential, nonce });
          if (signInError) { setError("Não foi possível concluir o login com Google."); return; }
          router.replace("/painel"); router.refresh();
        },
      });
      window.google.accounts.id.renderButton(button.current, { type: "standard", theme: "outline", size: "large", text: "continue_with", shape: "rectangular", width: Math.min(360, button.current.clientWidth || 360) });
      const dismissedAt = Number(localStorage.getItem("alcance_google_one_tap_dismissed_at") || 0);
      const cooldown = Date.now() - dismissedAt < 24 * 60 * 60 * 1000;
      if (oneTap && !cooldown) window.google.accounts.id.prompt((notification) => {
        if (notification.isDismissedMoment?.()) localStorage.setItem("alcance_google_one_tap_dismissed_at", String(Date.now()));
      });
    });
    return () => { active = false; window.google?.accounts.id.cancel(); };
  }, [clientId, enabled, loaded, oneTap, router]);

  async function oauthFallback() {
    setError("");
    const supabase = createClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${location.origin}/auth/callback?next=/painel`, queryParams: { access_type: "offline", prompt: "select_account" } } });
    if (oauthError) setError("Não foi possível iniciar o login com Google.");
  }

  if (!enabled) return null;
  if (!clientId) return <p className="auth-hint">Login Google aguardando configuração.</p>;
  return <div className="google-auth"><Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={() => setLoaded(true)} /><div ref={button} className="google-button" aria-label="Continuar com Google" />{loaded ? <button type="button" className="oauth-fallback" onClick={oauthFallback}>Usar login Google por redirecionamento</button> : <span className="auth-hint">Carregando Google…</span>}{error ? <p className="auth-error" role="status">{error}</p> : null}</div>;
}
