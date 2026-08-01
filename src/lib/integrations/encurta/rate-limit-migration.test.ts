import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/202608010028_whatsapp_shortener_idempotent_rate_limit.sql", "utf8");

describe("WhatsApp shortener idempotent rate-limit migration", () => {
  it("keeps idempotency hashes private and exposes only the service role RPC", () => {
    expect(migration).toContain("create table if not exists private.rate_limit_idempotency_keys");
    expect(migration).toContain("revoke all on table private.rate_limit_idempotency_keys from public, anon, authenticated");
    expect(migration).toContain("grant execute on function public.consume_idempotent_rate_limit");
  });

  it("aligns database limits and upgrades untouched defaults", () => {
    expect(migration).toContain("p_limit not between 1 and 100000");
    expect(migration).toContain("set value = '20'::jsonb");
    expect(migration).toContain("and value = '3'::jsonb");
  });
});
