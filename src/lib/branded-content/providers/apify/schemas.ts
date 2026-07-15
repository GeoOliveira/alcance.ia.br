import { z } from "zod";
const entity = z.object({ name: z.string().nullish(), link: z.string().nullish() }).passthrough();
export const apifyOutputItemSchema = z.object({ id: z.string().nullish(), dateCreated: z.string().nullish(), creator: entity.nullish(), brandPartners: z.array(entity).nullish(), type: z.string().nullish(), link: z.string().nullish() }).passthrough();
