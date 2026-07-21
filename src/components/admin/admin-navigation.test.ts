import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("admin integrations navigation", () => {
  const navigation = readFileSync("src/components/admin/admin-navigation.tsx", "utf8");
  const hub = readFileSync("src/app/admin/(protected)/integracoes/page.tsx", "utf8");
  const apify = readFileSync("src/app/admin/(protected)/integracoes/apify/page.tsx", "utf8");
  const turnstile = readFileSync("src/app/admin/(protected)/integracoes/turnstile/page.tsx", "utf8");

  it("agrupa integrações e conteúdo mantendo o grupo da rota atual aberto", () => {
    expect(navigation).toContain("admin-nav-group");
    expect(navigation).toContain('label: "ScrapeCreators"');
    expect(navigation).toContain('href: "/admin/integracoes/google", label: "Google"');
    expect(navigation).toContain('label: "OpenAI"');
    expect(navigation).toContain('label: "Turnstile"');
    expect(navigation).toContain('label: "Apify"');
    expect(navigation).toContain("const [integrationsOpen, setIntegrationsOpen] = useState(integrationActive)");
    expect(navigation).toContain("const [contentOpen, setContentOpen] = useState(contentActive)");
    expect(navigation).toContain('href: "/admin/conteudo/paginas"');
    expect(navigation).toContain("aria-expanded={integrationsOpen}");
    expect(navigation).toContain("integrationsOpen &&");
    expect(navigation).not.toContain('href: "/admin/ferramentas", label: "Ferramentas"');
  });

  it("oferece uma central e não expõe valores secretos do Turnstile", () => {
    expect(hub).toContain('title="Integrações"');
    expect(hub).toContain('name: "Apify"');
    expect(hub).toContain("status: isApifyConfigured");
    expect(apify).toContain("branded_content_search/page");
    expect(turnstile).toContain('title="Turnstile"');
    expect(turnstile).not.toContain("process.env.TURNSTILE_SECRET_KEY}");
    expect(turnstile).toContain("nunca são exibidas");
  });
});
