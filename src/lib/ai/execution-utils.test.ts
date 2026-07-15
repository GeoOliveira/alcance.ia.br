import { describe, expect, it, vi } from "vitest";
import type { AIProfileAnalysisInput } from "./contracts/ai-analysis-input";
import { OpenAIProviderError } from "./providers/openai/errors";
import { hashAIAnalysisInput, runWithSingleRetry } from "./execution-utils";

const input = { analysisContext: { analysisId: "11111111-1111-4111-8111-111111111111", metricsVersion: "v2", engagementFormulaVersion: "v2", engagementMetricsAudited: false, language: "pt-BR", postsAnalyzed: 1, reelsAnalyzed: 0, dataConfidence: "low", requestedFeatures: ["summary"] }, profile: {}, metrics: {}, deterministicFindings: [], contentSample: [], availableEvidenceIds: [] } as AIProfileAnalysisInput;
describe("AI cache hash and retry", () => {
  it("produces a stable SHA-256 hash and changes with input", () => { const first = hashAIAnalysisInput(input); expect(first).toMatch(/^[a-f0-9]{64}$/); expect(hashAIAnalysisInput(input)).toBe(first); expect(hashAIAnalysisInput({ ...input, metrics: { changed: 1 } })).not.toBe(first); });
  it("retries exactly once for a transient classified error", async () => { const operation = vi.fn().mockRejectedValueOnce(new OpenAIProviderError("id", true)).mockResolvedValue("ok"); await expect(runWithSingleRetry(operation, true)).resolves.toEqual({ value: "ok", retryCount: 1 }); expect(operation).toHaveBeenCalledTimes(2); });
  it("does not retry permanent errors or when disabled", async () => { const permanent = vi.fn().mockRejectedValue(new OpenAIProviderError("id", false)); await expect(runWithSingleRetry(permanent, true)).rejects.toThrow(); expect(permanent).toHaveBeenCalledTimes(1); const disabled = vi.fn().mockRejectedValue(new OpenAIProviderError("id", true)); await expect(runWithSingleRetry(disabled, false)).rejects.toThrow(); expect(disabled).toHaveBeenCalledTimes(1); });
});
