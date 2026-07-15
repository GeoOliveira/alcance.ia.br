import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { getOpenAIConfig } from "./providers/openai/config";
import { OpenAIConfigurationError } from "./providers/openai/errors";

const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/202607150008_openai_profile_analysis.sql"), "utf8");
const clientSource = readFileSync(resolve(process.cwd(), "src/lib/ai/providers/openai/client.ts"), "utf8");
const old = { key: process.env.OPENAI_API_KEY, model: process.env.OPENAI_MODEL };
afterEach(() => { if (old.key === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = old.key; if (old.model === undefined) delete process.env.OPENAI_MODEL; else process.env.OPENAI_MODEL = old.model; });

describe("OpenAI integration controls", () => {
  it("fails safely when key or model is absent", () => { delete process.env.OPENAI_API_KEY; delete process.env.OPENAI_MODEL; expect(() => getOpenAIConfig()).toThrow(OpenAIConfigurationError); process.env.OPENAI_API_KEY = "test-only"; expect(() => getOpenAIConfig()).toThrow(OpenAIConfigurationError); });
  it("uses Responses, structured output, no tools, no storage and no SDK retries", () => { expect(clientSource).toContain("client.responses.parse"); expect(clientSource).toContain("zodTextFormat"); expect(clientSource).toContain("store: false"); expect(clientSource).toContain("maxRetries: 0"); expect(clientSource).not.toMatch(/tools\s*:/); });
  it("ships feature flags disabled and recognizes the audited engagement-v2 gate", () => { for (const flag of ["ai_profile_analysis", "ai_profile_summary", "ai_bio_analysis", "ai_recommendations", "ai_content_ideas", "ai_action_plan_explanation"]) expect(migration).toMatch(new RegExp(`\\('${flag}'[^\\n]+false,'public'\\)`)); expect(migration).toContain("ai.engagement_interpretation_audited','true'"); expect(migration).toContain("engagement-v2"); });
  it("starts with public AI output hidden and permits the administrative ai category", () => { expect(migration).toContain("'ai.public_visibility','\"hidden\"'"); expect(migration).toContain("'scrapecreators','ai'"); });
  it("protects persistence with RLS and no public grants", () => { expect(migration).toContain("enable row level security"); expect(migration).toContain("revoke all on public.ai_analysis_runs from public, anon, authenticated"); expect(migration).not.toContain("grant insert on public.ai_analysis_runs to anon"); });
});
