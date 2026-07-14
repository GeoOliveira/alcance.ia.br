export const CONSENT_KEY = "alcance_cookie_consent";
export type CookieConsent = { essential: true; functional: boolean; analytics: boolean; marketing: boolean; updatedAt: string };

export const defaultConsent = (): CookieConsent => ({
  essential: true,
  functional: false,
  analytics: false,
  marketing: false,
  updatedAt: new Date().toISOString(),
});

export function parseConsent(value: string | null): CookieConsent | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<CookieConsent>;
    if (parsed.essential !== true || typeof parsed.updatedAt !== "string") return null;
    return {
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
