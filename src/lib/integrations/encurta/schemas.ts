import { z } from "zod";
import { isSafeEncurtaShortUrl, isValidEncurtaSlug } from "./url";

const shortLinkDataSchema = z.object({
  id: z.string().min(1),
  slug: z.string().refine(isValidEncurtaSlug),
  shortUrl: z.url().refine(isSafeEncurtaShortUrl),
  destinationType: z.literal("whatsapp"),
  status: z.literal("active"),
  expiresAt: z.iso.datetime({ offset: true }).nullable(),
  createdAt: z.iso.datetime({ offset: true }),
}).refine((value) => new URL(value.shortUrl).pathname === `/${value.slug}`, { path: ["shortUrl"], message: "A URL curta não corresponde ao slug." });

export const encurtaResponseSchema = z.object({
  data: shortLinkDataSchema,
  meta: z.object({ requestId: z.string().optional(), idempotentReplay: z.boolean().optional() }).optional(),
});

export const encurtaLookupResponseSchema = z.object({
  data: z.object({
    id: z.string().min(1),
    slug: z.string().refine(isValidEncurtaSlug),
    shortUrl: z.url().refine(isSafeEncurtaShortUrl),
    destinationType: z.literal("whatsapp"),
    status: z.enum(["active", "disabled", "blocked", "expired"]),
    expiresAt: z.iso.datetime({ offset: true }).nullable(),
    createdAt: z.iso.datetime({ offset: true }),
    lastAccessedAt: z.iso.datetime({ offset: true }).nullable(),
    clickCount: z.number().int().nonnegative(),
  }),
  meta: z.object({ requestId: z.string().optional() }).optional(),
});

export const encurtaErrorResponseSchema = z.object({
  error: z.object({ code: z.string().optional(), message: z.string().optional(), retryable: z.boolean().optional() }).optional(),
});

export type EncurtaResponse = z.infer<typeof encurtaResponseSchema>;
