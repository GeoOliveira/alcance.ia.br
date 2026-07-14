import { trackEvent } from "@/lib/analytics/track";

try {
  window.addEventListener("error", () => {
    trackEvent("client_error", { error_code: "window_error", page_path: window.location.pathname });
  });
  window.addEventListener("unhandledrejection", () => {
    trackEvent("client_error", { error_code: "unhandled_rejection", page_path: window.location.pathname });
  });
} catch {
  // Instrumentation must never prevent the application from hydrating.
}

export function onRouterTransitionStart() {
  try {
    performance.mark("alcance-route-transition");
  } catch {
    // Performance marks are optional.
  }
}
