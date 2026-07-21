import { isValidBrazilianAreaCode } from "./brazilian-area-codes";
import type { NormalizedBrazilianPhone } from "./types";

export class BrazilianPhoneError extends Error {
  constructor(public readonly code: "incomplete" | "invalid") {
    super(code === "incomplete" ? "Digite o DDD e o número do WhatsApp." : "Informe um número brasileiro válido com DDD.");
    this.name = "BrazilianPhoneError";
  }
}

const CONTROL_OR_LETTERS = /[\p{L}\p{C}]/u;
const SAFE_PHONE_INPUT = /^\+?[\d\s().-]+$/;

export function normalizeBrazilianWhatsAppNumber(input: string): NormalizedBrazilianPhone {
  const raw = input.trim();
  if (!raw) throw new BrazilianPhoneError("incomplete");
  if (CONTROL_OR_LETTERS.test(raw) || !SAFE_PHONE_INPUT.test(raw)) throw new BrazilianPhoneError("invalid");

  let digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0055")) digits = digits.slice(4);
  else if (digits.startsWith("55") && digits.length >= 12) digits = digits.slice(2);

  if (digits.length < 10) throw new BrazilianPhoneError("incomplete");
  if (digits.length !== 10 && digits.length !== 11) throw new BrazilianPhoneError("invalid");

  const areaCode = digits.slice(0, 2);
  const localNumber = digits.slice(2);
  if (!isValidBrazilianAreaCode(areaCode)) throw new BrazilianPhoneError("invalid");

  const isMobile = localNumber.length === 9;
  if (isMobile ? !/^9\d{8}$/.test(localNumber) : !/^[2-5]\d{7}$/.test(localNumber)) {
    throw new BrazilianPhoneError("invalid");
  }

  const formattedLocal = isMobile
    ? `${localNumber.slice(0, 5)}-${localNumber.slice(5)}`
    : `${localNumber.slice(0, 4)}-${localNumber.slice(4)}`;
  return {
    countryCode: "55",
    areaCode,
    localNumber,
    internationalNumber: `55${areaCode}${localNumber}`,
    formattedNational: `(${areaCode}) ${formattedLocal}`,
    isMobile,
  };
}

export function maskBrazilianPhone(input: string) {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length > 11) digits = digits.slice(2);
  digits = digits.slice(0, 11);
  if (digits.length <= 2) return digits ? `(${digits}` : "";
  const ddd = digits.slice(0, 2);
  const local = digits.slice(2);
  if (local.length <= 4) return `(${ddd}) ${local}`;
  const split = local.length > 8 ? 5 : 4;
  return `(${ddd}) ${local.slice(0, split)}-${local.slice(split)}`;
}
