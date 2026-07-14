import { describe, expect, it } from "vitest";
import { createCsv, safeCsvCell } from "./csv";

describe("CSV export safety", () => {
  it.each(["=SUM(A1:A2)", "+cmd", "-1+2", "@IMPORT", "\tformula"])("neutralizes %s", (value) => {
    expect(safeCsvCell(value)).toBe(`"'${value}"`);
  });

  it("escapes quotes and writes a BOM", () => {
    expect(createCsv(["Nome"], [["A \"B\""]])).toBe('\uFEFF"Nome"\r\n"A ""B"""');
  });
});
