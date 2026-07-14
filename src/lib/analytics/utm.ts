export const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;
export type UtmData = Partial<Record<(typeof utmKeys)[number], string>>;

export function parseUtm(input: URLSearchParams | Record<string, string | undefined>): UtmData {
  return Object.fromEntries(
    utmKeys.flatMap((key) => {
      const raw = input instanceof URLSearchParams ? input.get(key) : input[key];
      const value = raw?.trim().slice(0, 200);
      return value ? [[key, value]] : [];
    }),
  );
}
