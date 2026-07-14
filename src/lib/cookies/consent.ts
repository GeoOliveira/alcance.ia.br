export const CONSENT_KEY = "alcance_cookie_consent";
export const CONSENT_VERSION = 1;
export const CONSENT_UPDATED_EVENT = "alcance:consent-updated";

export type CookieConsent = {
  version: typeof CONSENT_VERSION;
  essential: true;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
  updatedAt: string;
};

export const defaultConsent = (now = new Date()): CookieConsent => ({
  version: CONSENT_VERSION,
  essential: true,
  functional: false,
  analytics: false,
  marketing: false,
  updatedAt: now.toISOString(),
});

export function parseConsent(value: string | null): CookieConsent | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<CookieConsent>;
    if (
      parsed.version !== CONSENT_VERSION ||
      parsed.essential !== true ||
      typeof parsed.updatedAt !== "string" ||
      Number.isNaN(Date.parse(parsed.updatedAt))
    ) return null;
    return {
      version: CONSENT_VERSION,
      essential: true,
      functional: parsed.functional === true,
      analytics: parsed.analytics === true,
      marketing: parsed.marketing === true,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

export function storeConsent(consent: CookieConsent, storage?: Pick<Storage, "setItem">) {
  const target = storage || (typeof window !== "undefined" ? window.localStorage : null);
  if (!target) return false;
  try {
    target.setItem(CONSENT_KEY, JSON.stringify(consent));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(CONSENT_UPDATED_EVENT, { detail: consent }));
    }
    return true;
  } catch {
    return false;
  }
}
