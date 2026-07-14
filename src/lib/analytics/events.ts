export type AnalyticsEvent =
  | "page_view" | "hero_cta_click" | "analysis_form_started" | "analysis_request_submitted"
  | "analysis_preview_viewed" | "signup_started" | "signup_completed" | "contact_form_submitted"
  | "cookie_consent_updated" | "login_clicked" | "legal_page_viewed";

export function trackEvent(name: AnalyticsEvent, properties: Record<string, string | boolean> = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("alcance:analytics", { detail: { name, properties } }));
}
