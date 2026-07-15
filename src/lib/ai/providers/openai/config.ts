import "server-only";
import { OpenAIConfigurationError } from "./errors";

const integer = (value: string | undefined, fallback: number, min: number, max: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
};

const reasoningEfforts = ["none", "low", "medium", "high", "xhigh"] as const;
type ReasoningEffort = (typeof reasoningEfforts)[number];

function reasoningEffort(value: string | undefined): ReasoningEffort {
  return reasoningEfforts.includes(value as ReasoningEffort) ? value as ReasoningEffort : "low";
}

export type OpenAIConfig = { apiKey: string; model: string; timeoutMs: number; maxOutputTokens: number; reasoningEffort: ReasoningEffort };

export function isOpenAIEnvironmentEnabled() {
  return process.env.OPENAI_AI_ANALYSIS_ENABLED === "true";
}

export function isOpenAIConfigured() {
  return Boolean(process.env.OPENAI_API_KEY?.trim() && process.env.OPENAI_MODEL?.trim());
}

export function getOpenAIConfig(executionId?: string): OpenAIConfig {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = process.env.OPENAI_MODEL?.trim();
  if (!apiKey) throw new OpenAIConfigurationError("A integração com IA não está configurada.", executionId, { missing: "OPENAI_API_KEY" });
  if (!model) throw new OpenAIConfigurationError("O modelo de IA não está configurado.", executionId, { missing: "OPENAI_MODEL" });
  return {
    apiKey,
    model,
    timeoutMs: integer(process.env.OPENAI_TIMEOUT_MS, 90_000, 1_000, 120_000),
    maxOutputTokens: integer(process.env.OPENAI_MAX_OUTPUT_TOKENS, 8_000, 256, 30_000),
    reasoningEffort: reasoningEffort(process.env.OPENAI_REASONING_EFFORT),
  };
}

export function getConfiguredModelName() { return process.env.OPENAI_MODEL?.trim() || null; }
