import { normalizeBrazilianWhatsAppNumber } from "./normalize-phone";

const FORBIDDEN_MESSAGE_CHARACTERS = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const ABUSIVE_INVISIBLE_RUN = /[\u200B-\u200F\u2060\uFEFF]{4,}/;

export function validateWhatsAppMessage(message: string, maxCharacters = 500) {
  if (message.length > maxCharacters) throw new Error(`A mensagem deve ter no máximo ${maxCharacters} caracteres.`);
  if (FORBIDDEN_MESSAGE_CHARACTERS.test(message) || ABUSIVE_INVISIBLE_RUN.test(message)) {
    throw new Error("A mensagem contém caracteres não permitidos.");
  }
  return message;
}

export function generateWhatsAppLink({ phone, message = "", messageMaxCharacters = 500 }: {
  phone: string;
  message?: string;
  messageMaxCharacters?: number;
}) {
  const normalized = normalizeBrazilianWhatsAppNumber(phone);
  const safeMessage = validateWhatsAppMessage(message, messageMaxCharacters);
  const url = new URL(`https://wa.me/${normalized.internationalNumber}`);
  if (safeMessage) url.searchParams.set("text", safeMessage);
  return { url: url.toString(), phone: normalized };
}

export function isSafeWhatsAppLink(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "wa.me" && /^\/55\d{10,11}$/.test(url.pathname);
  } catch {
    return false;
  }
}
