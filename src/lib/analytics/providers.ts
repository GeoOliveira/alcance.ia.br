import type { AnalyticsPayload } from "./types";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    clarity?: ((...args: unknown[]) => void) & { q?: unknown[][] };
  }
}

const initializedGa = new Set<string>();

export function configuredProviders(input: { gaId?: string; clarityId?: string }) {
  return {
    ga4: Boolean(input.gaId?.trim()),
    clarity: Boolean(input.clarityId?.trim()),
    meta: false,
    pinterest: false,
    reddit: false,
  };
}

export function initializeGoogleAnalytics(id: string) {
  if (!id || initializedGa.has(id)) return;
  window.dataLayer ||= [];
  window.gtag ||= (...args: unknown[]) => window.dataLayer?.push(args);
  window.gtag("js", new Date());
  window.gtag("config", id, {
    send_page_view: false,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    anonymize_ip: true,
  });
  initializedGa.add(id);
}

export function initializeClarityQueue() {
  if (window.clarity) return;
  const clarity = ((...args: unknown[]) => {
    clarity.q ||= [];
    clarity.q.push(args);
  }) as NonNullable<Window["clarity"]>;
  window.clarity = clarity;
}

export function sendToProviders(payload: AnalyticsPayload, providers: { gaId?: string; clarityId?: string }) {
  if (providers.gaId && window.gtag) {
    const properties = payload.name === "page_view"
      ? { ...payload.properties, page_location: window.location.href, page_title: document.title }
      : payload.properties;
    window.gtag("event", payload.name, properties);
  }
  if (providers.clarityId && window.clarity) window.clarity("event", payload.name);
}

export function resetProviderState() {
  initializedGa.clear();
}
