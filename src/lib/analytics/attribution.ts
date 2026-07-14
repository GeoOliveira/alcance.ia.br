import { hasAnalyticsConsent } from "./consent";

export const ATTRIBUTION_KEY = "alcance_attribution_v1";
export const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
export type UtmKey = (typeof utmKeys)[number];
export type UtmData = Partial<Record<UtmKey, string>>;
export type Touchpoint = UtmData & { captured_at: string; referrer_domain: string };
export type AttributionState = { version: 1; first_touch: Touchpoint; last_touch: Touchpoint };
type StorageLike = Pick<Storage, "getItem" | "setItem">;

let memoryAttribution: AttributionState | null = null;

function cleanCampaignValue(value: string | null | undefined) {
  const cleaned = value?.trim().replace(/[<>\u0000-\u001F\u007F]/g, "").slice(0, 200);
  return cleaned || undefined;
}

export function parseUtm(input: URLSearchParams | Record<string, string | undefined>): UtmData {
  return Object.fromEntries(
    utmKeys.flatMap((key) => {
      const raw = input instanceof URLSearchParams ? input.get(key) : input[key];
      const value = cleanCampaignValue(raw);
      return value ? [[key, value]] : [];
    }),
  );
}

export function referrerDomain(referrer: string, ownHostname = "") {
  if (!referrer) return "direct";
  try {
    const hostname = new URL(referrer).hostname.toLowerCase().replace(/^www\./, "");
    return !hostname || hostname === ownHostname.toLowerCase().replace(/^www\./, "") ? "direct" : hostname.slice(0, 200);
  } catch {
    return "direct";
  }
}

export function createTouchpoint(input: {
  search: string;
  referrer: string;
  ownHostname?: string;
  now?: Date;
}): Touchpoint {
  return {
    ...parseUtm(new URLSearchParams(input.search)),
    referrer_domain: referrerDomain(input.referrer, input.ownHostname),
    captured_at: (input.now || new Date()).toISOString(),
  };
}

export function updateAttribution(existing: AttributionState | null, touchpoint: Touchpoint): AttributionState {
  return { version: 1, first_touch: existing?.first_touch || touchpoint, last_touch: touchpoint };
}

export function parseAttribution(raw: string | null): AttributionState | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<AttributionState>;
    if (value.version !== 1 || !value.first_touch || !value.last_touch) return null;
    if (typeof value.first_touch.captured_at !== "string" || typeof value.last_touch.captured_at !== "string") return null;
    return value as AttributionState;
  } catch {
    return null;
  }
}

export function captureAttribution(
  input: Parameters<typeof createTouchpoint>[0],
  storage?: StorageLike,
  canPersist = false,
) {
  let stored: AttributionState | null = null;
  try {
    stored = storage && canPersist ? parseAttribution(storage.getItem(ATTRIBUTION_KEY)) : null;
  } catch {
    stored = null;
  }
  memoryAttribution = updateAttribution(stored || memoryAttribution, createTouchpoint(input));
  if (storage && canPersist) {
    try {
      storage.setItem(ATTRIBUTION_KEY, JSON.stringify(memoryAttribution));
    } catch {
      // Analytics attribution remains available in memory for the current navigation.
    }
  }
  return memoryAttribution;
}

export function initializeAttribution() {
  if (typeof window === "undefined") return null;
  return captureAttribution(
    {
      search: window.location.search,
      referrer: document.referrer,
      ownHostname: window.location.hostname,
    },
    window.localStorage,
    hasAnalyticsConsent(),
  );
}

export function persistAttributionAfterConsent() {
  if (!memoryAttribution || typeof window === "undefined" || !hasAnalyticsConsent()) return;
  try {
    window.localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(memoryAttribution));
  } catch {
    // Persistence is optional; tracking must not break the experience.
  }
}

export function attributionProperties(): UtmData & { referrer_domain?: string } {
  if (!memoryAttribution) return {};
  const properties: Partial<Touchpoint> = { ...memoryAttribution.first_touch };
  delete properties.captured_at;
  return properties;
}

export function attributionForSubmission(): UtmData {
  if (!memoryAttribution) initializeAttribution();
  if (!memoryAttribution) return {};
  return parseUtm(memoryAttribution.first_touch);
}

export function resetAttributionMemory() {
  memoryAttribution = null;
}
