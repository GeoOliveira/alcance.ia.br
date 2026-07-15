import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/202607150006_advanced_analysis_metrics.sql"), "utf8");
const recalculation = readFileSync(resolve(process.cwd(), "src/lib/analysis/recalculate-analysis.ts"), "utf8");
const publicFlowMigration = readFileSync(resolve(process.cwd(), "supabase/migrations/202607150009_public_analysis_flow.sql"), "utf8");

describe("advanced analysis persistence", () => {
  it("adds versioned JSONB fields and bounded calculation status", () => {
    for (const column of ["metrics_version", "calculated_metrics", "calculation_status", "calculation_started_at", "calculation_completed_at", "calculation_error"]) expect(migration).toContain(column);
    expect(migration).toContain("jsonb");
    expect(migration).toContain("pg_column_size(calculated_metrics) <= 262144");
  });

  it("ships all advanced feature flags disabled", () => {
    for (const flag of ["profile_completeness_analysis", "content_format_analysis", "engagement_stability_analysis", "recent_trend_analysis", "caption_analysis", "cta_analysis", "hashtag_analysis", "highlights_audit", "deterministic_action_plan"]) expect(migration).toMatch(new RegExp(`\\('${flag}'[^\\n]+false,'public'\\)`));
  });

  it("activates deterministic public modules without adding provider calls", () => {
    for (const flag of ["recent_trend_analysis", "caption_analysis", "cta_analysis", "hashtag_analysis", "deterministic_action_plan"]) expect(publicFlowMigration).toContain(`'${flag}'`);
    for (const setting of ["analysis.caption_analysis_enabled", "analysis.hashtag_analysis_enabled", "analysis.cta_analysis_enabled", "analysis.highlights_audit_enabled"]) expect(publicFlowMigration).toContain(`'${setting}'`);
    expect(publicFlowMigration).toContain("set enabled = true");
    expect(publicFlowMigration).not.toContain("scrapecreators");
  });

  it("recalculates only from persisted normalized data and never imports the provider", () => {
    expect(recalculation).toMatch(/select\("profile_data,posts_data,[^"]*metrics_version/);
    expect(recalculation).not.toContain("scrape-creators");
    expect(recalculation).not.toContain("fetch(");
  });
});
