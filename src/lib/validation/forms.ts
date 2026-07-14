import { z } from "zod";

const safeText = (max: number) => z.string().trim().min(1, "Campo obrigatório.").max(max).refine((v) => !/[<>]/.test(v), "Remova caracteres especiais.");

export const contactSchema = z.object({
  name: safeText(100),
  email: z.email("Informe um e-mail válido.").max(160),
  subject: z.enum(["analysis", "support", "privacy", "partnerships", "press", "other"]),
  message: safeText(3000).min(10, "Escreva pelo menos 10 caracteres."),
  privacyAccepted: z.literal(true),
  website: z.string().max(0).optional().default(""),
});

export const signupSchema = z.object({
  name: safeText(100),
  email: z.email("Informe um e-mail válido.").max(160),
  password: z.string().min(8, "Use pelo menos 8 caracteres.").max(72),
  termsAccepted: z.literal(true),
  privacyAccepted: z.literal(true),
  marketingAccepted: z.boolean().default(false),
});
