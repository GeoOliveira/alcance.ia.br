"use client";
import { useEffect, useState } from "react";
import Script from "next/script";
import { CONSENT_KEY, parseConsent } from "@/lib/cookies/consent";

export function AnalyticsLoader() {
  const [allowed, setAllowed] = useState(false);
  const ga = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID;
  useEffect(() => {
    const frame = requestAnimationFrame(() => setAllowed(parseConsent(localStorage.getItem(CONSENT_KEY))?.analytics === true));
    return () => cancelAnimationFrame(frame);
  }, []);
  if (!allowed || !ga) return null;
  return <><Script src={`https://www.googletagmanager.com/gtag/js?id=${ga}`} strategy="afterInteractive" /><Script id="ga-consented" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${ga}',{anonymize_ip:true});`}</Script></>;
}
