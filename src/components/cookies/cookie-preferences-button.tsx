"use client";

export function CookiePreferencesButton() {
  return (
    <button
      type="button"
      className="link-button"
      onClick={() => window.dispatchEvent(new Event("alcance:open-cookies"))}
    >
      Preferências de cookies
    </button>
  );
}
