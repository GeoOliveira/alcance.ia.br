import { describe, expect, it } from "vitest";
import { mergePublicSettings } from "./get-settings";

const defaults = {
  siteName: "Alcance IA", contactEmail: "a@example.com", supportEmail: "a@example.com",
  publicUrl: "https://example.com", analysisEnabled: true, analysisDemoMode: true,
  signupEnabled: false, maintenanceEnabled: false, maintenanceTitle: "Voltamos em breve",
  maintenanceMessage: "Mensagem segura de manutenção.", ga4Enabled: true, ga4MeasurementId: "G-ENV",
  clarityEnabled: true, clarityProjectId: "env123", cookieConsentVersion: "1", policyVersion: "1",
  analyticsEnvironment: "production" as const,
};

describe("public setting fallback", () => {
  it("prefers valid non-empty database IDs", () => {
    expect(mergePublicSettings([{ key: "analytics.ga4_measurement_id", value: "G-DATABASE" }], defaults).ga4MeasurementId)
      .toBe("G-DATABASE");
  });

  it("keeps environment fallback for an empty database ID", () => {
    expect(mergePublicSettings([{ key: "analytics.ga4_measurement_id", value: "" }], defaults).ga4MeasurementId)
      .toBe("G-ENV");
  });

  it("falls back entirely when a database value is invalid", () => {
    expect(mergePublicSettings([{ key: "general.public_url", value: "javascript:alert(1)" }], defaults))
      .toEqual(defaults);
  });
});
