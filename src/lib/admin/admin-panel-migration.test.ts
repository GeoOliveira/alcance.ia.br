import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/202607140003_admin_panel.sql"), "utf8");

describe("admin panel database security contract", () => {
  it("enables RLS on every administrative table without open policies", () => {
    for (const table of ["admin_profiles", "app_settings", "feature_flags", "site_content", "site_faqs", "admin_audit_logs"]) {
      expect(migration).toContain(`alter table public.${table} enable row level security`);
    }
    expect(migration).not.toMatch(/using\s*\(\s*true\s*\)/i);
  });

  it("prevents physical profile deletion and removal of the last super administrator", () => {
    expect(migration).toContain("admin profiles cannot be physically deleted");
    expect(migration).toContain("cannot remove the last active super admin");
    expect(migration).toContain("create trigger protect_last_super_admin");
  });

  it("restricts destructive record functions and keeps an audit event", () => {
    expect(migration).toMatch(/admin_anonymize_analysis_request[\s\S]*has_admin_role\(array\['super_admin'\]\)/);
    expect(migration).toContain("analysis_request_anonymized");
    expect(migration).toContain("analysis_request_deleted");
    expect(migration).toContain("contact_message_deleted");
  });

  it("removes identifying analysis fields during anonymization", () => {
    for (const assignment of ["user_id = null", "utm_source = null", "referrer = null", "landing_page = null", "admin_notes = null"]) {
      expect(migration).toContain(assignment);
    }
  });
});
