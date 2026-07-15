import { describe, expect, it } from "vitest";
import { isTerminalAnalysisState } from "./analysis-status";

describe("isTerminalAnalysisState", () => {
  it.each(["waiting", "processing"])("keeps polling for %s", (state) => {
    expect(isTerminalAnalysisState(state)).toBe(false);
  });

  it.each(["completed", "partial", "not_found", "private", "insufficient_data", "temporary_error", "unavailable", "demo"])("reveals the terminal state %s", (state) => {
    expect(isTerminalAnalysisState(state)).toBe(true);
  });

  it("does not navigate for an unknown state", () => {
    expect(isTerminalAnalysisState("unknown")).toBe(false);
  });
});
