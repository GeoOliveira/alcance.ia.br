import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("admin product resource updates", () => {
  const action = readFileSync("src/app/admin/(protected)/recursos/actions.ts", "utf8");

  it("accepts persisted resource keys added by later migrations", () => {
    expect(action).toContain("key: z.string().trim()");
    expect(action).not.toContain("key: z.enum(productFeatureKeys)");
  });

  it("preserves safe persisted dependencies and synchronizes operational flags", () => {
    expect(action).toContain("safeDependencyKey.test(item)");
    expect(action).toContain('whatsapp_link_manager: "resource_whatsapp_link_manager"');
    expect(action).toContain('whatsapp_manager_google_one_tap: "whatsapp_manager_google_one_tap"');
    expect(action).toContain('whatsapp_manager_shortener: "encurta_integration"');
    expect(action).toContain('revalidateTag("public-flags", "max")');
  });
});
