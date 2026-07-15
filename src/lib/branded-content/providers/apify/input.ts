import { z } from "zod";
import type { BrandedContentSearchInput } from "../../contracts/search-input";
import { buildMetaBrandedContentLibraryUrl } from "./build-library-url";

export const apifyInputSchema = z.object({ startUrls: z.array(z.string().url()).min(1).max(1), resultsLimit: z.number().int().min(1).max(500), onlyPostsNewerThan: z.string().date(), onlyPostsOlderThan: z.string().date() }).strict();
export type ApifyBrandCollaborationInput = z.infer<typeof apifyInputSchema>;
export function buildApifyInput(input: BrandedContentSearchInput): ApifyBrandCollaborationInput {
  return apifyInputSchema.parse({ startUrls: [buildMetaBrandedContentLibraryUrl(input)], resultsLimit: input.resultsLimit, onlyPostsNewerThan: input.dateMin, onlyPostsOlderThan: input.dateMax });
}
