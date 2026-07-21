import { describe, expect, it } from "vitest";
import { resolveAuthOrigin } from "./auth-origin";

describe("origem de autenticação administrativa", () => {
  it("usa a origem HTTPS do Preview", () => {
    expect(resolveAuthOrigin("https://alcance-preview.vercel.app", "https://alcance.ia.br"))
      .toBe("https://alcance-preview.vercel.app");
  });

  it("rejeita protocolos inseguros e credenciais na URL", () => {
    expect(resolveAuthOrigin("javascript:alert(1)", "https://alcance.ia.br/path")).toBe("https://alcance.ia.br");
    expect(resolveAuthOrigin("https://user:pass@example.com", "https://alcance.ia.br")).toBe("https://alcance.ia.br");
  });
});
