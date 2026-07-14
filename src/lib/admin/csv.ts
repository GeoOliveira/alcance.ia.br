const dangerousSpreadsheetPrefix = /^[=+\-@\t\r]/;

export function safeCsvCell(value: unknown) {
  const raw = value == null ? "" : String(value);
  const protectedValue = dangerousSpreadsheetPrefix.test(raw) ? `'${raw}` : raw;
  return `"${protectedValue.replaceAll('"', '""')}"`;
}

export function createCsv(headers: string[], rows: unknown[][]) {
  return `\uFEFF${[headers, ...rows].map((row) => row.map(safeCsvCell).join(",")).join("\r\n")}`;
}
