import { describe, expect, it } from "vitest";
import { auditSanitizerForTests } from "./audit";

describe("audit sanitizer", () => {
  it("removes secrets and personal message fields", () => {
    expect(auditSanitizerForTests({ status: "new", password: "x", message: "private", token: "x" }))
      .toEqual({ status: "new" });
  });
});
