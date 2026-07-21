import { attributionProperties } from "./attribution";
import { hasAnalyticsConsent } from "./consent";
import {
  analyticsEvents,
  type AnalyticsEvent,
  type AnalyticsEventProperties,
  type AnalyticsPayload,
  type AnalyticsValue,
  type TrackOptions,
} from "./types";

export const ANALYTICS_EVENT = "alcance:analytics";
const allowedEvents = new Set<string>(analyticsEvents);
const allowedProperties = new Set([
  "page_path", "cta_location", "form_name", "error_code", "request_id",
  "consent_category", "navigation_target", "analytics_enabled", "marketing_enabled",
  "section_id",
  "platform", "period_selected", "result_count", "cache_status", "status", "access_level",
  "message_used",
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "referrer_domain",
]);
const recentEvents = new Map<string, number>();

export function sanitizeProperties(properties: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(properties).flatMap(([key, raw]) => {
      if (!allowedProperties.has(key) || !["string", "number", "boolean"].includes(typeof raw)) return [];
      if (typeof raw === "string") {
        const value = raw.trim().replace(/[<>\u0000-\u001F\u007F]/g, "").slice(0, 200);
        return value ? [[key, value]] : [];
      }
      return [[key, raw as AnalyticsValue]];
    }),
  ) as Record<string, AnalyticsValue>;
}

export function trackEvent<Name extends AnalyticsEvent>(
  name: Name,
  properties: AnalyticsEventProperties[Name] = {} as AnalyticsEventProperties[Name],
  options: TrackOptions = {},
) {
  if (typeof window === "undefined" || !allowedEvents.has(name) || !hasAnalyticsConsent()) return false;
  const safeProperties = sanitizeProperties({ ...attributionProperties(), ...properties });
  const dedupeKey = options.dedupeKey || `${name}:${JSON.stringify(safeProperties)}`;
  const now = Date.now();
  const dedupeWindow = options.dedupeWindowMs ?? 1000;
  const previous = recentEvents.get(dedupeKey);
  if (previous && now - previous < dedupeWindow) return false;
  recentEvents.set(dedupeKey, now);
  const payload: AnalyticsPayload<Name> = { name, properties: safeProperties };
  window.dispatchEvent(new CustomEvent(ANALYTICS_EVENT, { detail: payload }));
  return true;
}

export function resetEventDeduplication() {
  recentEvents.clear();
}
