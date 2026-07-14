"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { CONSENT_KEY, parseConsent } from "@/lib/cookies/consent";
import { listenForConsent } from "@/lib/analytics/consent";
import {
  initializeAttribution,
  persistAttributionAfterConsent,
} from "@/lib/analytics/attribution";
import {
  initializeClarityQueue,
  initializeGoogleAnalytics,
  sendToProviders,
} from "@/lib/analytics/providers";
import { ANALYTICS_EVENT, trackEvent } from "@/lib/analytics/track";
import type { AnalyticsPayload } from "@/lib/analytics/types";

export function AnalyticsLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [allowed, setAllowed] = useState(false);
  const gaId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID?.trim();
  const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID?.trim();

  useEffect(() => {
    initializeAttribution();
    const stored = parseConsent(window.localStorage.getItem(CONSENT_KEY));
    let frame = 0;
    if (stored?.analytics) {
      if (gaId) initializeGoogleAnalytics(gaId);
      if (clarityId) initializeClarityQueue();
      persistAttributionAfterConsent();
      frame = requestAnimationFrame(() => setAllowed(true));
    }
    const stopListening = listenForConsent((consent) => {
      const nextAllowed = consent?.analytics === true;
      if (nextAllowed) {
        if (gaId) initializeGoogleAnalytics(gaId);
        if (clarityId) initializeClarityQueue();
        persistAttributionAfterConsent();
      }
      setAllowed(nextAllowed);
    });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      stopListening();
    };
  }, [clarityId, gaId]);

  useEffect(() => {
    const receive = (event: Event) => {
      if (!allowed || !(event instanceof CustomEvent)) return;
      sendToProviders(event.detail as AnalyticsPayload, { gaId, clarityId });
    };
    window.addEventListener(ANALYTICS_EVENT, receive);
    return () => window.removeEventListener(ANALYTICS_EVENT, receive);
  }, [allowed, clarityId, gaId]);

  useEffect(() => {
    if (!allowed) return;
    const query = searchParams.toString();
    const pagePath = `${pathname}${query ? `?${query}` : ""}`;
    trackEvent("page_view", { page_path: pagePath }, { dedupeKey: `page_view:${pagePath}` });
  }, [allowed, pathname, searchParams]);

  if (!allowed) return null;
  return (
    <>
      {gaId && <Script id="ga4-consented" src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`} strategy="afterInteractive" />}
      {clarityId && <Script id="clarity-consented" src={`https://www.clarity.ms/tag/${encodeURIComponent(clarityId)}`} strategy="lazyOnload" />}
      <Analytics />
      <SpeedInsights />
    </>
  );
}
