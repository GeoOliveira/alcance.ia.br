import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const limit = vi.fn();
  const order = vi.fn(() => ({ limit }));
  const select = vi.fn(() => ({ order }));
  const from = vi.fn(() => ({ select }));
  return { from, limit, order, select };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({ from: mocks.from }),
}));

import { listAdminTable } from "./data";

describe("admin data", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.limit.mockResolvedValue({ data: [], error: null });
  });

  it("orders home content by its real content_key column", async () => {
    await expect(listAdminTable("site_content")).resolves.toEqual([]);

    expect(mocks.from).toHaveBeenCalledWith("site_content");
    expect(mocks.order).toHaveBeenCalledWith("content_key", { ascending: true });
  });

  it("keeps the key ordering used by settings and feature flags", async () => {
    await listAdminTable("app_settings");
    await listAdminTable("feature_flags");

    expect(mocks.order).toHaveBeenNthCalledWith(1, "key", { ascending: true });
    expect(mocks.order).toHaveBeenNthCalledWith(2, "key", { ascending: true });
  });
});
