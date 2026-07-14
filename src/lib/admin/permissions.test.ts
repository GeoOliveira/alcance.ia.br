import { describe, expect, it } from "vitest";
import { canAssignRole, hasPermission } from "./permissions";

describe("admin permissions", () => {
  it("allows only the expected roles to manage settings", () => {
    expect(hasPermission("super_admin", "settings.manage")).toBe(true);
    expect(hasPermission("admin", "settings.manage")).toBe(true);
    expect(hasPermission("editor", "settings.manage")).toBe(false);
  });

  it("restricts destructive access to super administrators", () => {
    expect(hasPermission("super_admin", "analysis.delete")).toBe(true);
    expect(hasPermission("admin", "analysis.delete")).toBe(false);
  });

  it("never permits assigning super_admin from the panel", () => {
    expect(canAssignRole("super_admin", "admin")).toBe(true);
    expect(canAssignRole("super_admin", "super_admin")).toBe(false);
    expect(canAssignRole("admin", "editor")).toBe(false);
  });
});
