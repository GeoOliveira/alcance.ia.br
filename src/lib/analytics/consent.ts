import {
  CONSENT_KEY,
  CONSENT_UPDATED_EVENT,
  parseConsent,
  type CookieConsent,
} from "@/lib/cookies/consent";

export function hasAnalyticsConsent(storage?: Pick<Storage, "getItem">) {
  if (!storage && typeof window === "undefined") return false;
  try {
    const selectedStorage = storage || window.localStorage;
    return parseConsent(selectedStorage.getItem(CONSENT_KEY))?.analytics === true;
  } catch {
    return false;
  }
}

export function listenForConsent(callback: (consent: CookieConsent | null) => void) {
  const update = (event: Event) => {
    const detail = event instanceof CustomEvent ? event.detail as CookieConsent | undefined : undefined;
    callback(detail || null);
  };
  window.addEventListener(CONSENT_UPDATED_EVENT, update);
  return () => window.removeEventListener(CONSENT_UPDATED_EVENT, update);
}
