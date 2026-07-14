import { describe, expect, it } from "vitest";
import { contentUpdateSchema, safeAdminRedirect, settingUpdateSchema } from "./validation";

describe("admin validation", () => {
  it("blocks external redirects", () => {
    expect(safeAdminRedirect("https://evil.example/admin")).toBe("/admin");
    expect(safeAdminRedirect("//evil.example/admin")).toBe("/admin");
    expect(safeAdminRedirect("/admin/contatos")).toBe("/admin/contatos");
  });

  it("rejects markup in managed content", () => {
    expect(contentUpdateSchema.safeParse({ id: crypto.randomUUID(), value: "<script>alert(1)</script>" }).success).toBe(false);
  });

  it("rejects arbitrary setting keys", () => {
    expect(settingUpdateSchema.safeParse({ id: crypto.randomUUID(), key: "SECRET_KEY", value: "x" }).success).toBe(false);
  });
});
