import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("WhatsApp manager panel integration", () => {
  const createForm = readFileSync("src/components/whatsapp-manager/create-link-form.tsx", "utf8");
  const data = readFileSync("src/lib/whatsapp-manager/data.ts", "utf8");
  const shell = readFileSync("src/components/layout/application-shell.tsx", "utf8");
  const panelShell = readFileSync("src/components/whatsapp-manager/panel-shell.tsx", "utf8");

  it("reads the create response at the level returned by the API", () => {
    expect(createForm).toContain("payload.data?.id");
    expect(createForm).not.toContain("result.data?.data?.id");
  });

  it("synchronizes click totals through the verified Encurta lookup", () => {
    expect(data).toContain("getEncurtaLinkSnapshot");
    expect(data).toContain('user_link_metric_cache").upsert');
    expect(data).toContain("click_count: total");
  });

  it("uses a private collapsed panel shell without the public chrome", () => {
    expect(shell).toContain('pathname.startsWith("/painel")');
    expect(panelShell).toContain("useState(true)");
    expect(panelShell).toContain("<PanelTabs />");
  });
});
