import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("public resources navigation", () => {
  const config = readFileSync("src/config/site.ts", "utf8");
  const header = readFileSync("src/components/layout/public-resources-menu.tsx", "utf8");
  const mobile = readFileSync("src/components/layout/mobile-menu.tsx", "utf8");
  const siteHeader = readFileSync("src/components/layout/header.tsx", "utf8");

  it("lista as ferramentas públicas, incluindo gerador e gerenciador do WhatsApp", () => {
    expect(config).toContain('href: "/recursos/hashtags"');
    expect(config).toContain('href: "/recursos/reels-em-alta"');
    expect(config).toContain('href: "/recursos/reels-por-categoria"');
    expect(config).toContain('href: "/recursos/conteudo-de-marca"');
    expect(config).toContain('href: "/recursos/gerenciador-links-whatsapp"');
    expect(config).toContain('label: "Gerenciador de Link WhatsApp"');
    expect(config).toContain('href: "/recursos/gerador-link-whatsapp"');
    expect(config).toContain('label: "Gerador de Link WhatsApp"');
    expect(siteHeader).toContain("resourceNavigation");
  });

  it("oferece submenus fechados por padrão no desktop e no celular", () => {
    expect(header).toContain('className="public-resources-menu"');
    expect(header).toContain("closeOnOutsideInteraction");
    expect(mobile).toContain('<details className="mobile-resources-menu">');
    expect(header).not.toContain('<details open');
    expect(mobile).not.toContain('<details open');
  });
});
