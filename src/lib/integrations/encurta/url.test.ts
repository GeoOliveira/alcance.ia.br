import { describe, expect, it } from "vitest";
import { isSafeEncurtaShortUrl, isValidEncurtaSlug } from "./url";

describe("Encurta.io short URL validation", () => {
  it("accepts the current four-character slug contract", () => {
    expect(isValidEncurtaSlug("B7xK")).toBe(true);
    expect(isSafeEncurtaShortUrl("https://encurta.io/B7xK")).toBe(true);
    expect(isSafeEncurtaShortUrl("https://www.encurta.io/B7xK")).toBe(true);
  });

  it("rejects slugs below four characters and unsafe URL variants", () => {
    expect(isValidEncurtaSlug("Ab3")).toBe(false);
    expect(isSafeEncurtaShortUrl("https://encurta.io/Ab3")).toBe(false);
    expect(isSafeEncurtaShortUrl("https://evil.example/B7xK")).toBe(false);
    expect(isSafeEncurtaShortUrl("https://encurta.io/B7xK?redirect=evil")).toBe(false);
  });
});
