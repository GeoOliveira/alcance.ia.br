import "server-only";
import { OpenAIConfigurationError } from "./errors";

const integer = (value: string | undefined, fallback: number, min: number, max: number) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
};

export type OpenAIConfig = { apiKey: string; model: string; timeoutMs: number; maxOutputTokens: number };

export function isOpenAIEnvironmentEnabled() {
  return process.env.OPENAI_AI_ANALYSIS_ENABLED === "true";
}

export function getOpenAIConfig(executionId?: string): OpenAIConfig {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  const model = process.env.OPENAI_MODEL?.trim();
  if (!apiKey) throw new OpenAIConfigurationError("A integração com IA não está configurada.", executionId, { missing: "OPENAI_API_KEY" });
  if (!model) throw new OpenAIConfigurationError("O modelo de IA não está configurado.", executionId, { missing: "OPENAI_MODEL" });
  return { apiKey, model, timeoutMs: integer(process.env.OPENAI_TIMEOUT_MS, 30_000, 1_000, 120_000), maxOutputTokens: integer(process.env.OPENAI_MAX_OUTPUT_TOKENS, 1_800, 256, 8_000) };
}

export function getConfiguredModelName() { return process.env.OPENAI_MODEL?.trim() || null; }
