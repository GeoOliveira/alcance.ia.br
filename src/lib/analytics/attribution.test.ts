import { beforeEach, describe, expect, it } from "vitest";
import {
  ATTRIBUTION_KEY,
  captureAttribution,
  parseUtm,
  resetAttributionMemory,
  updateAttribution,
  createTouchpoint,
} from "./attribution";

class MemoryStorage {
  values = new Map<string, string>();
  getItem(key: string) { return this.values.get(key) || null; }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

describe("campaign attribution", () => {
  beforeEach(() => resetAttributionMemory());

  it("parses only supported UTMs and sanitizes their values", () => {
    expect(parseUtm(new URLSearchParams("utm_source=%3Cgoogle%3E&utm_campaign=launch&email=x%40test.com"))).toEqual({
      utm_source: "google",
      utm_campaign: "launch",
    });
  });

  it("preserves first touch while updating last touch", () => {
    const first = createTouchpoint({ search: "?utm_source=google", referrer: "https://google.com", now: new Date("2026-07-14T10:00:00Z") });
    const initial = updateAttribution(null, first);
    const last = createTouchpoint({ search: "?utm_source=newsletter", referrer: "", now: new Date("2026-07-14T11:00:00Z") });
    const updated = updateAttribution(initial, last);
    expect(updated.first_touch.utm_source).toBe("google");
    expect(updated.last_touch.utm_source).toBe("newsletter");
  });

  it("persists attribution only when consent allows it", () => {
    const storage = new MemoryStorage();
    captureAttribution({ search: "?utm_medium=social", referrer: "" }, storage, false);
    expect(storage.getItem(ATTRIBUTION_KEY)).toBeNull();
    captureAttribution({ search: "?utm_medium=organic", referrer: "" }, storage, true);
    expect(storage.getItem(ATTRIBUTION_KEY)).toContain("social");
    expect(storage.getItem(ATTRIBUTION_KEY)).toContain("organic");
  });
});
