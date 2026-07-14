import "server-only";
import { z } from "zod";
import { ScrapeCreatorsConfigurationError } from "./errors";

const schema = z.object({
  apiKey: z.string().min(1), baseUrl: z.url().refine((url) => url.startsWith("https://")),
  timeoutMs: z.number().int().min(1000).max(60000), enabled: z.boolean(),
});

export type ScrapeCreatorsConfig = z.infer<typeof schema>;
export function readScrapeCreatorsConfig(requestId = crypto.randomUUID()): ScrapeCreatorsConfig {
  const result = schema.safeParse({
    apiKey: process.env.SCRAPECREATORS_API_KEY,
    baseUrl: process.env.SCRAPECREATORS_BASE_URL || "https://api.scrapecreators.com",
    timeoutMs: Number(process.env.SCRAPECREATORS_TIMEOUT_MS || "20000"),
    enabled: process.env.SCRAPECREATORS_POC_ENABLED === "true",
  });
  if (!result.success) throw new ScrapeCreatorsConfigurationError("configuration", "A ScrapeCreators não está configurada no servidor.", false, "configuration", requestId, null, 0, { fields: result.error.issues.map((issue) => issue.path.join(".")) });
  if (!result.data.enabled) throw new ScrapeCreatorsConfigurationError("configuration", "A prova de conceito está desativada no ambiente.", false, "configuration", requestId);
  return result.data;
}
