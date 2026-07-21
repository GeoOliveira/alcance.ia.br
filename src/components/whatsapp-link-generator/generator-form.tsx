"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { trackEvent } from "@/lib/analytics/track";
import { generateWhatsAppLink, isSafeWhatsAppLink } from "@/lib/whatsapp/generate-link";
import { maskBrazilianPhone } from "@/lib/whatsapp/normalize-phone";
import type { NormalizedBrazilianPhone, WhatsAppGeneratorFlags } from "@/lib/whatsapp/types";
import { isSafeEncurtaShortUrl } from "@/lib/integrations/encurta/url";
import styles from "./whatsapp-generator.module.css";

type GeneratedResult = { url: string; phone: NormalizedBrazilianPhone; message: string };
type ShortLinkResult = { id: string; slug: string; shortUrl: string; officialUrl: string; status: string; expiresAt: string | null; createdAt: string; idempotentReplay: boolean };
type ShortenState = "idle" | "shortening" | "completed" | "failed";
type CopyTarget = "official" | "short" | null;

function createRequestId() {
  return `req_${crypto.randomUUID().replaceAll("-", "")}`;
}

export function GeneratorForm({ flags, messageMaxCharacters, accessLevel }: {
  flags: WhatsAppGeneratorFlags;
  messageMaxCharacters: number;
  accessLevel: "public" | "free" | "premium" | "admin";
}) {
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [shortLink, setShortLink] = useState<ShortLinkResult | null>(null);
  const [shortenState, setShortenState] = useState<ShortenState>("idle");
  const [shortenError, setShortenError] = useState("");
  const [requestId, setRequestId] = useState("");
  const [copied, setCopied] = useState<CopyTarget>(null);
  const canShare = useSyncExternalStore(
    () => () => undefined,
    () => typeof navigator.share === "function",
    () => false,
  );
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shortenController = useRef<AbortController | null>(null);
  const hasFocusedResult = useRef(false);
  const resultTitle = useRef<HTMLHeadingElement | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimer.current) clearTimeout(copyTimer.current);
      shortenController.current?.abort();
    };
  }, []);
  useEffect(() => {
    if (result && !hasFocusedResult.current && resultTitle.current) {
      hasFocusedResult.current = true;
      resultTitle.current.focus();
    }
  }, [result]);

  const analytics = (name: "whatsapp_link_generated" | "whatsapp_link_copied" | "whatsapp_link_opened" | "whatsapp_link_shared" | "whatsapp_short_link_requested" | "whatsapp_short_link_created" | "whatsapp_short_link_failed" | "whatsapp_short_link_copied" | "whatsapp_short_link_opened" | "whatsapp_short_link_shared" | "whatsapp_short_link_retry", status = "success") => {
    trackEvent(name, { status, access_level: accessLevel, message_used: Boolean(message.trim()) }, { dedupeWindowMs: 1500 });
  };

  async function shortenOfficialLink(generated: GeneratedResult, operationRequestId: string) {
    if (!flags.shortener) return;
    shortenController.current?.abort();
    const controller = new AbortController();
    shortenController.current = controller;
    setShortenState("shortening");
    setShortenError("");
    analytics("whatsapp_short_link_requested");
    try {
      const response = await fetch("/api/whatsapp-links/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({ phone: generated.phone.internationalNumber, message: generated.message, requestId: operationRequestId }),
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok || !payload || typeof payload !== "object" || !("data" in payload)) {
        const publicError = payload && typeof payload === "object" && "error" in payload
          ? typeof payload.error === "string"
            ? payload.error
            : typeof payload.error === "object" && payload.error && "message" in payload.error && typeof payload.error.message === "string"
              ? payload.error.message
              : "Não foi possível criar o link curto."
          : "Não foi possível criar o link curto.";
        throw new Error(publicError);
      }
      const data = (payload as { data?: ShortLinkResult }).data;
      if (!data || typeof data.shortUrl !== "string" || !isSafeEncurtaShortUrl(data.shortUrl)) throw new Error("Não foi possível validar o link curto recebido.");
      setShortLink(data);
      setShortenState("completed");
      analytics("whatsapp_short_link_created");
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      setShortenState("failed");
      setShortenError(caught instanceof Error ? caught.message : "Não foi possível criar o link curto.");
      analytics("whatsapp_short_link_failed", "failed");
    } finally {
      if (shortenController.current === controller) shortenController.current = null;
    }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    try {
      const generated = generateWhatsAppLink({ phone, message: flags.customMessage ? message : "", messageMaxCharacters });
      const operationRequestId = createRequestId();
      hasFocusedResult.current = false;
      setResult({ ...generated, message: flags.customMessage ? message : "" });
      setShortLink(null);
      setRequestId(operationRequestId);
      setShortenError("");
      setShortenState(flags.shortener ? "shortening" : "idle");
      analytics("whatsapp_link_generated");
      if (flags.shortener) void shortenOfficialLink({ ...generated, message: flags.customMessage ? message : "" }, operationRequestId);
    } catch (caught) {
      setResult(null);
      setShortLink(null);
      setShortenState("idle");
      setError(caught instanceof Error ? caught.message : "Não foi possível gerar o link.");
      analytics("whatsapp_link_generated", "validation_error");
    }
  }

  async function copyText(value: string, target: Exclude<CopyTarget, null>) {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
      else {
        const input = document.createElement("textarea");
        input.value = value;
        input.setAttribute("readonly", "");
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.select();
        const succeeded = document.execCommand("copy");
        input.remove();
        if (!succeeded) throw new Error("copy_failed");
      }
      setCopied(target);
      analytics(target === "short" ? "whatsapp_short_link_copied" : "whatsapp_link_copied");
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(null), 2500);
    } catch {
      setError("Não foi possível copiar automaticamente. Selecione o link e copie manualmente.");
      analytics(target === "short" ? "whatsapp_short_link_copied" : "whatsapp_link_copied", "failed");
    }
  }

  async function shareLink(value: string, short = false) {
    if (!flags.share || !navigator.share) return;
    try {
      await navigator.share({ title: short ? "Meu link curto do WhatsApp" : "Meu link do WhatsApp", text: "Fale comigo pelo WhatsApp", url: value });
      analytics(short ? "whatsapp_short_link_shared" : "whatsapp_link_shared");
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === "AbortError") return;
      analytics(short ? "whatsapp_short_link_shared" : "whatsapp_link_shared", "failed");
    }
  }

  const retryShortening = () => {
    if (!result || !requestId) return;
    analytics("whatsapp_short_link_retry");
    void shortenOfficialLink(result, requestId);
  };

  return <div className={styles.formCard} id="gerador">
    <div className={styles.formHeading}><span aria-hidden="true">↗</span><div><strong>Monte seu link</strong><small>Brasil · link oficial wa.me</small></div></div>
    <form onSubmit={submit} noValidate>
      <label className={styles.label} htmlFor="whatsapp-phone">Número do WhatsApp</label>
      <div className={styles.phoneRow}><div className={styles.country} aria-label="Código do país Brasil, mais cinquenta e cinco"><span aria-hidden="true">🇧🇷</span><strong>+55</strong></div><input id="whatsapp-phone" name="phone" type="tel" inputMode="tel" enterKeyHint={flags.customMessage ? "next" : "go"} autoComplete="tel-national" placeholder="Ex.: (71) 99999-9999" value={phone} onChange={(event) => { setPhone(maskBrazilianPhone(event.target.value)); setError(""); }} aria-describedby={error ? "whatsapp-error" : "phone-help"} aria-invalid={Boolean(error)} required /></div>
      <small id="phone-help" className={styles.help}>Digite o DDD e o número. Aceitamos celular e telefone fixo brasileiro.</small>
      {flags.customMessage && <><div className={styles.labelRow}><label className={styles.label} htmlFor="whatsapp-message">Mensagem personalizada <span>Opcional</span></label><output aria-live="polite">{message.length}/{messageMaxCharacters}</output></div><textarea id="whatsapp-message" name="message" rows={4} maxLength={messageMaxCharacters} placeholder="Ex.: Olá! Gostaria de saber mais sobre seus serviços." value={message} onChange={(event) => { setMessage(event.target.value); setError(""); }} /></>}
      {error && <p id="whatsapp-error" className={styles.error} role="alert">{error}</p>}
      <button className={styles.primaryButton} type="submit">Gerar link do WhatsApp <span aria-hidden="true">→</span></button>
      <p className={styles.localNotice}><span aria-hidden="true">◇</span> {flags.shortener ? "O link oficial é gerado localmente. Para criar o link curto, os dados necessários são enviados com segurança ao Encurta.io." : "Gerado no seu dispositivo. Nada é salvo por esta ferramenta."}</p>
    </form>

    {result && <section className={styles.result} aria-live="polite" aria-labelledby="result-title">
      <div className={styles.successIcon} aria-hidden="true">✓</div><div><h2 id="result-title" ref={resultTitle} tabIndex={-1}>{shortLink ? "Seu link curto está pronto" : "Seu link oficial está pronto"}</h2><p>{result.phone.formattedNational}{result.message ? ` · “${result.message.slice(0, 72)}${result.message.length > 72 ? "…" : ""}”` : ""}</p></div>
      {shortenState === "shortening" && <p className={styles.shortStatus} role="status">Criando seu link curto…</p>}
      {shortenState === "failed" && <div className={styles.shortError} role="status"><span>{shortenError} Seu link oficial continua disponível abaixo.</span><button type="button" onClick={retryShortening}>Tentar encurtar novamente</button></div>}
      {shortLink && <div className={styles.shortLinkPanel}><div><span>LINK CURTO</span><strong>Seu link curto está pronto</strong></div><input className={styles.resultUrl} value={shortLink.shortUrl} readOnly aria-label="Link curto do WhatsApp" onFocus={(event) => event.currentTarget.select()} /><div className={styles.resultActions}>{flags.copy && <button type="button" onClick={() => void copyText(shortLink.shortUrl, "short")}>{copied === "short" ? "Link curto copiado" : "Copiar link curto"}</button>}{flags.open && isSafeEncurtaShortUrl(shortLink.shortUrl) && <a href={shortLink.shortUrl} target="_blank" rel="noopener noreferrer" onClick={() => analytics("whatsapp_short_link_opened")}>Abrir link curto</a>}{flags.share && flags.shortenerShare && canShare && <button type="button" onClick={() => void shareLink(shortLink.shortUrl, true)}>Compartilhar</button>}</div></div>}
      <div className={styles.officialLinkPanel}><div><span>LINK OFICIAL DO WHATSAPP</span><strong>Use como alternativa ou backup</strong></div><input className={styles.resultUrl} value={result.url} readOnly aria-label="Link oficial do WhatsApp gerado" onFocus={(event) => event.currentTarget.select()} /><div className={styles.resultActions}>{flags.copy && <button type="button" onClick={() => void copyText(result.url, "official")}>{copied === "official" ? "Link oficial copiado" : "Copiar link oficial"}</button>}{flags.open && isSafeWhatsAppLink(result.url) && <a href={result.url} target="_blank" rel="noopener noreferrer" onClick={() => analytics("whatsapp_link_opened")}>Abrir WhatsApp</a>}{flags.share && !shortLink && canShare && <button type="button" onClick={() => void shareLink(result.url)}>Compartilhar</button>}<button type="button" className={styles.editButton} onClick={() => { shortenController.current?.abort(); setResult(null); setShortLink(null); setShortenState("idle"); setShortenError(""); setRequestId(""); document.getElementById("whatsapp-phone")?.focus(); }}>Editar</button></div></div>
      <span className={styles.copyStatus} aria-live="polite">{copied ? `${copied === "short" ? "Link curto" : "Link oficial"} copiado para a área de transferência.` : ""}</span>
    </section>}
    {!flags.shortener && <p className={styles.soon}>Em breve você também poderá criar uma versão curta e personalizada deste link.</p>}
  </div>;
}
