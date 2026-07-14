import { z } from "zod";
import { instagramInputSchema } from "./instagram";

const unsafeCharacters = /[<>\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;
const singleLineText = (max: number) =>
  z
    .string()
    .trim()
    .min(1, "Campo obrigatório.")
    .max(max, `Use no máximo ${max} caracteres.`)
    .refine((value) => !unsafeCharacters.test(value) && !/[\r\n]/.test(value), "Remova caracteres inválidos.")
    .transform((value) => value.replace(/\s+/g, " "));
const multilineText = (max: number) =>
  z
    .string()
    .transform((value) => value.replace(/\r\n?/g, "\n").trim())
    .pipe(
      z
        .string()
        .min(10, "Escreva pelo menos 10 caracteres.")
        .max(max, `Use no máximo ${max} caracteres.`)
        .refine((value) => !unsafeCharacters.test(value), "Remova caracteres inválidos."),
    );

const protectionFields = {
  website: z.string().max(200).optional().default(""),
  formToken: z.string().min(20).max(1000),
  turnstileToken: z.string().max(2048).optional().default(""),
};

const optionalCampaignValue = z.string().trim().max(200).optional().default("");
const referrerSchema = z
  .string()
  .trim()
  .max(500)
  .refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }, "Referência inválida.")
  .optional()
  .default("");

export const analysisSubmissionSchema = z.object({
  instagram: instagramInputSchema,
  landingPage: z
    .string()
    .trim()
    .max(300)
    .refine((value) => value.startsWith("/") && !unsafeCharacters.test(value), "Página de entrada inválida.")
    .default("/"),
  referrer: referrerSchema,
  utm_source: optionalCampaignValue,
  utm_medium: optionalCampaignValue,
  utm_campaign: optionalCampaignValue,
  utm_content: optionalCampaignValue,
  utm_term: optionalCampaignValue,
  ...protectionFields,
});

export const contactSchema = z.object({
  name: singleLineText(100),
  email: z.email("Informe um e-mail válido.").max(160).transform((value) => value.trim().toLowerCase()),
  subject: z.enum(["analysis", "support", "privacy", "partnerships", "press", "other"]),
  message: multilineText(3000),
  privacyAccepted: z.literal(true),
  ...protectionFields,
});

export const signupSchema = z.object({
  name: singleLineText(100),
  email: z.email("Informe um e-mail válido.").max(160).transform((value) => value.trim().toLowerCase()),
  termsAccepted: z.literal(true),
  privacyAccepted: z.literal(true),
  marketingAccepted: z.boolean().default(false),
  ...protectionFields,
});
