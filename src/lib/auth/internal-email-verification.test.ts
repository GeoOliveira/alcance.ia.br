import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("internal email verification", () => {
  const migration = readFileSync("supabase/migrations/202607200026_internal_email_verification.sql", "utf8");
  const panelLayout = readFileSync("src/app/painel/layout.tsx", "utf8");
  const authLayout = readFileSync("src/app/(user-auth)/layout.tsx", "utf8");
  const applicationShell = readFileSync("src/components/layout/application-shell.tsx", "utf8");

  it("keeps verification tokens private and prevents self-verification", () => {
    expect(migration).toContain("token_hash text not null unique");
    expect(migration).toContain("revoke all on public.user_email_verification_tokens from public, anon, authenticated");
    expect(migration).toContain("revoke update on public.user_profiles from authenticated");
    expect(migration).not.toMatch(/grant update \([^)]*email_verified_at/);
  });

  it("does not require internal email verification to access the panel", () => {
    expect(panelLayout).not.toContain("Verifique seu e-mail");
    expect(panelLayout).not.toContain("resendVerificationEmailAction");
  });

  it("does not repeat the logo inside authentication pages", () => {
    expect(authLayout).not.toContain("<Logo");
    expect(applicationShell).toContain("isUserAuthPage ? null : footer");
  });
});
