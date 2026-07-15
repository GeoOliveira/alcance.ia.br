import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
const migration = readFileSync("supabase/migrations/202607150017_branded_content_search.sql", "utf8");
describe("branded content migration", () => {
  it("mantém recurso e flags fechados por padrão", () => { expect(migration).toContain("'branded_content_search'"); for (const flag of ["resource_branded_content","resource_branded_content_pagination","resource_branded_content_dashboard","resource_branded_content_ai","resource_branded_content_history","resource_branded_content_export","resource_branded_content_premium_preview"]) expect(migration).toMatch(new RegExp(`\\('${flag}'[^\\n]+false`)); });
  it("cria telemetria com RLS sem token nem paging.next", () => { expect(migration).toContain("branded_content_search_runs"); expect(migration).toContain("enable row level security"); expect(migration).not.toContain("access_token"); expect(migration).not.toContain("paging.next"); });
});
