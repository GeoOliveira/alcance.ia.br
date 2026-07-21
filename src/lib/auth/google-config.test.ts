import { readFileSync } from "node:fs";
import { describe,expect,it } from "vitest";

describe("Google auth admin configuration",()=>{
  const migration=readFileSync("supabase/migrations/202607200025_admin_tools_google_auth.sql","utf8");
  const page=readFileSync("src/app/admin/(protected)/integracoes/google/page.tsx","utf8");
  it("persiste somente configurações públicas ou documentais",()=>{expect(migration).toContain("auth.google_client_id");expect(migration).toContain("auth.google_authorized_origins");expect(migration).not.toMatch(/client_secret|google_secret/i)});
  it("orienta que o segredo permaneça no Supabase",()=>{expect(page).toContain("Client Secret");expect(page).toContain("Authentication → Providers → Google");expect(page).not.toContain("GOOGLE_CLIENT_SECRET")});
  it("separa origens do Google e retornos do Supabase",()=>{expect(page).toContain("Origem JavaScript de produção");expect(page).toContain("Redirect URL de produção");expect(page).toContain("Provider no Supabase")});
});
