import { describe, expect, it, vi } from "vitest";
import {
  CONSENT_KEY,
  CONSENT_UPDATED_EVENT,
  defaultConsent,
  parseConsent,
  storeConsent,
} from "./consent";

describe("cookie consent", () => {
  it("reads a current, valid and versioned decision", () => {
    const consent = { ...defaultConsent(new Date("2026-07-14T12:00:00Z")), functional: true };
    expect(parseConsent(JSON.stringify(consent))?.functional).toBe(true);
  });

  it("rejects malformed, old or invalid decisions", () => {
    expect(parseConsent("{")).toBeNull();
    expect(parseConsent(JSON.stringify({ essential: true, updatedAt: "2026-07-13" }))).toBeNull();
    expect(parseConsent(JSON.stringify({ ...defaultConsent(), essential: false }))).toBeNull();
  });

  it("stores the choice and notifies listeners", () => {
    const setItem = vi.fn();
    const dispatchEvent = vi.fn();
    vi.stubGlobal("window", { localStorage: { setItem }, dispatchEvent });
    const consent = defaultConsent(new Date("2026-07-14T12:00:00Z"));
    expect(storeConsent(consent)).toBe(true);
    expect(setItem).toHaveBeenCalledWith(CONSENT_KEY, JSON.stringify(consent));
    expect((dispatchEvent.mock.calls[0]?.[0] as Event).type).toBe(CONSENT_UPDATED_EVENT);
    vi.unstubAllGlobals();
  });
});
