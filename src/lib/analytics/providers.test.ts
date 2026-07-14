import { afterEach, describe, expect, it, vi } from "vitest";
import {
  configuredProviders,
  initializeGoogleAnalytics,
  resetProviderState,
  sendToProviders,
} from "./providers";

describe("analytics providers", () => {
  afterEach(() => {
    resetProviderState();
    vi.unstubAllGlobals();
  });

  it("ignores providers without configuration", () => {
    expect(configuredProviders({})).toMatchObject({ ga4: false, clarity: false, meta: false });
  });

  it("initializes GA4 without an automatic page view or advertising signals", () => {
    vi.stubGlobal("window", { dataLayer: [] });
    initializeGoogleAnalytics("G-TEST123");
    expect(window.dataLayer).toContainEqual(["config", "G-TEST123", expect.objectContaining({ send_page_view: false, allow_google_signals: false })]);
  });

  it("forwards safe events to configured runtime providers", () => {
    const gtag = vi.fn();
    const clarity = vi.fn();
    vi.stubGlobal("window", { gtag, clarity, location: { href: "https://alcance.ia.br/" } });
    vi.stubGlobal("document", { title: "Alcance IA" });
    sendToProviders({ name: "analysis_form_started", properties: { form_name: "analysis" } }, { gaId: "G-TEST", clarityId: "clarity" });
    expect(gtag).toHaveBeenCalledWith("event", "analysis_form_started", { form_name: "analysis" });
    expect(clarity).toHaveBeenCalledWith("event", "analysis_form_started");
  });
});
