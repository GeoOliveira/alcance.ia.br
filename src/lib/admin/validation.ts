import { z } from "zod";
import { adminRoles } from "@/types/admin";

const noMarkup = z.string().refine((value) => !/<\s*(script|iframe|object|embed|style|html)/i.test(value), {
  message: "HTML ou scripts não são permitidos.",
});

export const loginSchema = z.object({
  email: z.email("Informe um e-mail válido.").trim().max(160),
  password: z.string().min(8, "Informe sua senha.").max(200),
  next: z.string().max(300).optional(),
});

export const passwordRecoverySchema = z.object({
  email: z.email("Informe um e-mail válido.").trim().max(160),
});

export const updatePasswordSchema = z.object({
  password: z.string().min(12, "Use pelo menos 12 caracteres.").max(200),
  confirmation: z.string().max(200),
}).refine((value) => value.password === value.confirmation, {
  path: ["confirmation"], message: "As senhas não coincidem.",
});

export const settingUpdateSchema = z.object({
  id: z.uuid(),
  key: z.string().regex(/^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/),
  value: z.string().max(5000),
});

export const featureFlagSchema = z.object({ id: z.uuid(), enabled: z.enum(["true", "false"]) });
export const contentUpdateSchema = z.object({ id: z.uuid(), value: noMarkup.min(1).max(1000) });
export const faqSchema = z.object({
  id: z.uuid().optional(),
  question: noMarkup.min(10, "A pergunta deve ter pelo menos 10 caracteres.").max(240),
  answer: noMarkup.min(10, "A resposta deve ter pelo menos 10 caracteres.").max(2000),
  position: z.coerce.number().int().min(0).max(10000),
  isActive: z.enum(["true", "false"]),
});

export const recordUpdateSchema = z.object({
  id: z.uuid(),
  status: z.string().min(2).max(40),
  notes: noMarkup.max(4000),
});

export const criticalActionSchema = z.object({
  id: z.uuid(),
  confirmation: z.string(),
  expected: z.string(),
  reason: noMarkup.max(500).optional().default(""),
}).refine((value) => value.confirmation === value.expected, {
  path: ["confirmation"], message: "A palavra de confirmação não confere.",
});

export const adminProfileSchema = z.object({
  userId: z.uuid("Informe o UUID do usuário existente no Supabase Auth."),
  displayName: noMarkup.min(2).max(100),
  role: z.enum(adminRoles).exclude(["super_admin"]),
});

export function safeAdminRedirect(value: string | null | undefined) {
  if (!value || !value.startsWith("/admin") || value.startsWith("//") || value.startsWith("/admin/login")) return "/admin";
  return value;
}
