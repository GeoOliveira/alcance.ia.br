import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { defaultConsent } from "@/lib/cookies/consent";
import { resetAttributionMemory } from "./attribution";
import { resetEventDeduplication, sanitizeProperties, trackEvent } from "./track";

function browserWithConsent(analytics: boolean) {
  const dispatchEvent = vi.fn();
  const consent = { ...defaultConsent(), analytics };
  vi.stubGlobal("window", {
    localStorage: { getItem: () => JSON.stringify(consent) },
    dispatchEvent,
  });
  return dispatchEvent;
}

describe("analytics tracking", () => {
  beforeEach(() => {
    resetEventDeduplication();
    resetAttributionMemory();
  });
  afterEach(() => vi.unstubAllGlobals());

  it("blocks all analytics without analytical consent", () => {
    const dispatchEvent = browserWithConsent(false);
    expect(trackEvent("page_view", { page_path: "/" })).toBe(false);
    expect(dispatchEvent).not.toHaveBeenCalled();
  });

  it("dispatches a configured typed event after consent", () => {
    const dispatchEvent = browserWithConsent(true);
    expect(trackEvent("analysis_form_started", { form_name: "analysis" })).toBe(true);
    expect(dispatchEvent).toHaveBeenCalledOnce();
  });

  it("removes prohibited or unknown properties at runtime", () => {
    expect(sanitizeProperties({ email: "person@example.com", message: "private", page_path: "/contato" })).toEqual({ page_path: "/contato" });
  });

  it("deduplicates repeated events in the configured window", () => {
    const dispatchEvent = browserWithConsent(true);
    expect(trackEvent("page_view", { page_path: "/" })).toBe(true);
    expect(trackEvent("page_view", { page_path: "/" })).toBe(false);
    expect(dispatchEvent).toHaveBeenCalledOnce();
  });
});
