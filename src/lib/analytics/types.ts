export const analyticsEvents = [
  "page_view",
  "legal_page_viewed",
  "faq_opened",
  "navigation_clicked",
  "analysis_form_viewed",
  "analysis_form_started",
  "analysis_form_validation_error",
  "analysis_request_submitted",
  "analysis_request_succeeded",
  "analysis_request_failed",
  "analysis_rate_limited",
  "analysis_processing_viewed",
  "analysis_preview_viewed",
  "analysis_viewed",
  "analysis_completed",
  "analysis_dashboard_opened",
  "analysis_dashboard_chart_viewed",
  "analysis_dashboard_premium_preview_viewed",
  "analysis_dashboard_premium_clicked",
  "analysis_error_viewed",
  "analysis_refresh_clicked",
  "analysis_post_clicked",
  "analysis_top_post_clicked",
  "analysis_section_viewed",
  "analysis_action_plan_viewed",
  "analysis_methodology_opened",
  "analysis_recalculate_requested",
  "analysis_final_cta_clicked",
  "feature_preview_viewed",
  "feature_interest_submitted",
  "discovery_page_viewed",
  "feature_viewed",
  "feature_locked_viewed",
  "feature_interest_registered",
  "category_selected",
  "reel_ranking_viewed",
  "hashtag_ranking_viewed",
  "trending_reels_viewed",
  "signup_cta_clicked",
  "signup_started",
  "signup_completed",
  "login_clicked",
  "contact_form_started",
  "contact_form_submitted",
  "contact_form_succeeded",
  "contact_form_failed",
  "cookie_banner_viewed",
  "cookie_consent_updated",
  "cookie_preferences_opened",
  "client_error",
  "server_action_failed",
] as const;

export type AnalyticsEvent = (typeof analyticsEvents)[number];
export type AnalyticsValue = string | number | boolean;

type AttributionProperties = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referrer_domain?: string;
};

type CommonProperties = AttributionProperties & {
  page_path?: string;
  cta_location?: string;
  form_name?: "analysis" | "contact" | "signup";
  error_code?: string;
  request_id?: string;
  consent_category?: "analytics" | "functional" | "marketing";
  navigation_target?: string;
  section_id?: string;
  analytics_enabled?: boolean;
  marketing_enabled?: boolean;
};

export type AnalyticsEventProperties = {
  [Name in AnalyticsEvent]: CommonProperties;
};

export type AnalyticsPayload<Name extends AnalyticsEvent = AnalyticsEvent> = {
  name: Name;
  properties: AnalyticsEventProperties[Name];
};

export type TrackOptions = { dedupeKey?: string; dedupeWindowMs?: number };
