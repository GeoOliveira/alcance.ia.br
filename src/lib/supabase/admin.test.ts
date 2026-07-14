import { afterEach, describe, expect, it, vi } from "vitest";
import { createAdminClient } from "./admin";

describe("Supabase admin client", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("fails closed when server credentials are absent", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect(createAdminClient()).toBeNull();
  });

  it("fails closed when the project URL is invalid", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "not-a-url");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-key");
    expect(createAdminClient()).toBeNull();
  });
});
