import "server-only";
import { getApifyClient } from "@/lib/providers/apify/client";
import { ApifyProviderError } from "./errors";
import type { ApifyBrandCollaborationInput } from "./input";

const activeRuns = new Map<string, Promise<{ items: unknown[]; runId: string; datasetId: string; durationMs: number }>>();
export async function runApifyBrandCollaboration(input: ApifyBrandCollaborationInput, deduplicationKey: string) {
  const existing = activeRuns.get(deduplicationKey); if (existing) return existing;
  const promise = (async () => {
    const started = Date.now();
    try {
      const { client, config } = getApifyClient();
      const run = await client.actor(config.actorId).call(input);
      if (!run.defaultDatasetId) throw new ApifyProviderError("APIFY_INVALID_RESPONSE", 502, "O provedor retornou uma resposta inválida.", true, Date.now() - started);
      const dataset = await client.dataset(run.defaultDatasetId).listItems({ limit: input.resultsLimit, clean: true });
      return { items: dataset.items as unknown[], runId: run.id, datasetId: run.defaultDatasetId, durationMs: Date.now() - started };
    } catch (error) {
      if (error instanceof ApifyProviderError) throw error;
      const message = error instanceof Error ? error.message.toLowerCase() : "";
      const timeout = message.includes("timeout") || message.includes("timed out");
      throw new ApifyProviderError(timeout ? "APIFY_TIMEOUT" : "APIFY_PROVIDER", timeout ? 504 : 502, "O serviço de pesquisa está temporariamente indisponível.", true, Date.now() - started);
    }
  })();
  activeRuns.set(deduplicationKey, promise);
  try { return await promise; } finally { activeRuns.delete(deduplicationKey); }
}
