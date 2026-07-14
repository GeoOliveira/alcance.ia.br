"use client";

import { trackEvent } from "@/lib/analytics/track";

export function CookiePreferencesButton() {
  return (
    <button
      type="button"
      className="link-button"
      onClick={() => {
        trackEvent("cookie_preferences_opened");
        window.dispatchEvent(new Event("alcance:open-cookies"));
      }}
    >
      Preferências de cookies
    </button>
  );
}
