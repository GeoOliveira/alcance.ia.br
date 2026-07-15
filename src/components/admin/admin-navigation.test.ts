import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("admin integrations navigation", () => {
  const navigation = readFileSync("src/components/admin/admin-navigation.tsx", "utf8");
  const hub = readFileSync("src/app/admin/(protected)/integracoes/page.tsx", "utf8");
  const turnstile = readFileSync("src/app/admin/(protected)/integracoes/turnstile/page.tsx", "utf8");

  it("agrupa as três integrações sob um único menu", () => {
    expect(navigation).toContain("admin-nav-group");
    expect(navigation).toContain('label: "ScrapeCreators"');
    expect(navigation).toContain('label: "OpenAI"');
    expect(navigation).toContain('label: "Turnstile"');
  });

  it("oferece uma central e não expõe valores secretos do Turnstile", () => {
    expect(hub).toContain('title="Integrações"');
    expect(turnstile).toContain('title="Turnstile"');
    expect(turnstile).not.toContain("process.env.TURNSTILE_SECRET_KEY}");
    expect(turnstile).toContain("nunca são exibidas");
  });
});
