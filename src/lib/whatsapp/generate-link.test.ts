import { describe, expect, it } from "vitest";
import { generateWhatsAppLink, isSafeWhatsAppLink, validateWhatsAppMessage } from "./generate-link";
import { BrazilianPhoneError, maskBrazilianPhone, normalizeBrazilianWhatsAppNumber } from "./normalize-phone";

describe("normalizeBrazilianWhatsAppNumber", () => {
  it.each([
    ["71999999999", "5571999999999"],
    ["(71) 99999-9999", "5571999999999"],
    ["71 99999-9999", "5571999999999"],
    ["+55 71 99999-9999", "5571999999999"],
    ["55 71 99999-9999", "5571999999999"],
    ["  (71) 99999-9999  ", "5571999999999"],
    ["7133334444", "557133334444"],
  ])("normaliza %s", (input, expected) => {
    expect(normalizeBrazilianWhatsAppNumber(input).internationalNumber).toBe(expected);
  });

  it.each(["00199999999", "7199999999", "719999999", "71A99999999", "71 99999-9999 / 3333", "557199999999955"])("rejeita %s", (input) => {
    expect(() => normalizeBrazilianWhatsAppNumber(input)).toThrow(BrazilianPhoneError);
  });

  it("distingue erro incompleto", () => {
    expect(() => normalizeBrazilianWhatsAppNumber("71 999")).toThrow("Digite o DDD e o número do WhatsApp.");
  });

  it("aplica máscara sem alterar a validação", () => {
    expect(maskBrazilianPhone("+55 71 99999-9999")).toBe("(71) 99999-9999");
  });
});

describe("generateWhatsAppLink", () => {
  it("gera URL sem mensagem", () => {
    expect(generateWhatsAppLink({ phone: "71999999999" }).url).toBe("https://wa.me/5571999999999");
  });

  it.each(["Olá!", "Oi 👋", "A & B?", "Linha 1\nLinha 2"])("codifica com segurança: %s", (message) => {
    const result = generateWhatsAppLink({ phone: "+55 (71) 99999-9999", message });
    expect(new URL(result.url).searchParams.get("text")).toBe(message);
    expect(isSafeWhatsAppLink(result.url)).toBe(true);
  });

  it("rejeita mensagem acima do limite e controles", () => {
    expect(() => validateWhatsAppMessage("a".repeat(501))).toThrow("500 caracteres");
    expect(() => validateWhatsAppMessage("oi\u0000")).toThrow("não permitidos");
  });
});
