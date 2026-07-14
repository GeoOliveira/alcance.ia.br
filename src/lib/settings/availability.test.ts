import { describe, expect, it } from "vitest";
import { isMaintenanceMode, isPublicFormAvailable } from "./availability";

const settings = { maintenanceEnabled: false, analysisEnabled: true, signupEnabled: true };

describe("public operational availability", () => {
  it("lets either maintenance control close the public application", () => {
    expect(isMaintenanceMode(settings, { maintenance_mode: true })).toBe(true);
    expect(isMaintenanceMode({ ...settings, maintenanceEnabled: true }, {})).toBe(true);
  });

  it("fails closed for disabled forms without affecting unrelated forms", () => {
    expect(isPublicFormAvailable("analysis", settings, { instagram_analysis: false })).toBe(false);
    expect(isPublicFormAvailable("contact", settings, { instagram_analysis: false })).toBe(true);
    expect(isPublicFormAvailable("signup", { ...settings, signupEnabled: false }, {})).toBe(false);
  });
});
