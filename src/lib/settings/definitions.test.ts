import { describe, expect, it } from "vitest";
import { parseSettingInput } from "./definitions";

describe("setting validation", () => {
  it("parses known typed values", () => {
    expect(parseSettingInput("analysis.daily_limit", "number", "250")).toEqual({ success: true, value: 250 });
    expect(parseSettingInput("analysis.enabled", "boolean", "false")).toEqual({ success: true, value: false });
  });

  it("rejects unknown keys and invalid public IDs", () => {
    expect(parseSettingInput("private.secret", "string", "x").success).toBe(false);
    expect(parseSettingInput("analytics.ga4_measurement_id", "string", "<script>").success).toBe(false);
  });

  it("validates advanced analysis limits and toggles", () => {
    expect(parseSettingInput("analysis.minimum_posts_per_format", "number", "3")).toEqual({ success: true, value: 3 });
    expect(parseSettingInput("analysis.minimum_posts_per_format", "number", "200").success).toBe(false);
    expect(parseSettingInput("analysis.maximum_action_items", "number", "6").success).toBe(false);
    expect(parseSettingInput("analysis.caption_analysis_enabled", "boolean", "true")).toEqual({ success: true, value: true });
  });
});
