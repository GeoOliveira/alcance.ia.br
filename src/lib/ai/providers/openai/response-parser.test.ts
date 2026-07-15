import { describe, expect, it } from "vitest";
import { parseOpenAIProfileAnalysis } from "./response-parser";

describe("parseOpenAIProfileAnalysis", () => {
  it("classifies an explicitly incomplete response", () => {
    expect(() => parseOpenAIProfileAnalysis(null, "execution", 100, {
      status: "incomplete",
      incompleteReason: "max_output_tokens",
    })).toThrow(expect.objectContaining({
      code: "openai_incomplete_response",
      safeDetails: { reason: "max_output_tokens" },
    }));
  });

  it("classifies only an explicit refusal as content refusal", () => {
    expect(() => parseOpenAIProfileAnalysis(null, "execution", 100, {
      hasRefusal: true,
    })).toThrow(expect.objectContaining({ code: "openai_content_refusal" }));
  });

  it("classifies a missing parsed output as invalid", () => {
    expect(() => parseOpenAIProfileAnalysis(null, "execution", 100)).toThrow(expect.objectContaining({
      code: "openai_invalid_response",
      safeDetails: { reason: "missing_output_parsed" },
    }));
  });
});
