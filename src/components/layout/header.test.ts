import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("public resources navigation", () => {
  const config = readFileSync("src/config/site.ts", "utf8");
  const header = readFileSync("src/components/layout/public-resources-menu.tsx", "utf8");
  const mobile = readFileSync("src/components/layout/mobile-menu.tsx", "utf8");

  it("lista as quatro ferramentas públicas", () => {
    expect(config).toContain('href: "/recursos/hashtags"');
    expect(config).toContain('href: "/recursos/reels-em-alta"');
    expect(config).toContain('href: "/recursos/reels-por-categoria"');
    expect(config).toContain('href: "/recursos/conteudo-de-marca"');
  });

  it("oferece submenus fechados por padrão no desktop e no celular", () => {
    expect(header).toContain('className="public-resources-menu"');
    expect(header).toContain("closeOnOutsideInteraction");
    expect(mobile).toContain('<details className="mobile-resources-menu">');
    expect(header).not.toContain('<details open');
    expect(mobile).not.toContain('<details open');
  });
});
