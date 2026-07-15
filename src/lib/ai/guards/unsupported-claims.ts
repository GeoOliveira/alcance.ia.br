const blockedPatterns = [
  /seguidores? fals[oa]s?/iu, /fraude|fraudulento/iu, /garant(?:e|ido|imos).*?(crescimento|alcance|vendas?)/iu,
  /instagram insights/iu, /diagn[oó]stico psicol[oó]gico/iu, /apar[eê]ncia f[ií]sica/iu,
  /com certeza (?:vai|terá|ter[aá])/iu, /benchmark (?:do|de|para) nicho/iu,
];

export function findUnsupportedClaims(value: unknown): string[] {
  const text = JSON.stringify(value);
  return blockedPatterns.flatMap((pattern) => pattern.test(text) ? [pattern.source] : []);
}
