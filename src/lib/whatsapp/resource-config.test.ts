import { describe, expect, it } from "vitest";
import { shortenerTierAllowed } from "./resource-config";

describe("WhatsApp shortener access tiers", () => {
  const flags = { whatsapp_link_shortener_anonymous: false, whatsapp_link_shortener_free: false, whatsapp_link_shortener_premium: false };

  it("keeps anonymous access closed independently of the master flag", () => {
    expect(shortenerTierAllowed("anonymous", flags)).toBe(false);
    expect(shortenerTierAllowed("anonymous", { ...flags, whatsapp_link_shortener_free: true })).toBe(false);
  });

  it("enables only the selected account tier", () => {
    expect(shortenerTierAllowed("free", { ...flags, whatsapp_link_shortener_free: true })).toBe(true);
    expect(shortenerTierAllowed("premium", { ...flags, whatsapp_link_shortener_free: true })).toBe(false);
    expect(shortenerTierAllowed("premium", { ...flags, whatsapp_link_shortener_premium: true })).toBe(true);
  });

  it("allows administrators only after the master integration barriers are evaluated", () => {
    expect(shortenerTierAllowed("admin", flags)).toBe(true);
  });
});
