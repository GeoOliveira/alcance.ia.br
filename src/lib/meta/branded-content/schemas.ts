import { z } from "zod";
export const BRANDED_CONTENT_EARLIEST_DATE = "2023-08-17";
export const brandedContentPlatformSchema = z.enum(["instagram", "facebook"]);
export const cursorSchema = z.string().min(1).max(1000).refine((value) => !/[\u0000-\u001f\u007f]/.test(value), "Cursor inválido.");
export const rawEntitySchema = z.object({ id: z.union([z.string(), z.number()]).optional(), name: z.string().optional(), url: z.string().optional() }).passthrough();
export const rawResultSchema = z.object({ creation_date: z.string().optional(), creator: rawEntitySchema.nullish(), partners: z.array(rawEntitySchema).optional(), type: z.string().optional(), url: z.string().optional() }).passthrough();
export const rawResponseSchema = z.object({ data: z.array(rawResultSchema), paging: z.object({ cursors: z.object({ after: z.string().optional() }).optional(), next: z.string().optional() }).optional() }).passthrough();
