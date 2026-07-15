const blockedPatterns = [
  /seguidores? fals[oa]s?/iu, /fraude|fraudulento/iu, /garant(?:e|ido|imos).*?(crescimento|alcance|vendas?)/iu,
  /instagram insights/iu, /diagn[oó]stico psicol[oó]gico/iu, /apar[eê]ncia f[ií]sica/iu,
  /com certeza (?:vai|terá|ter[aá])/iu, /benchmark (?:do|de|para) nicho/iu,
];

export function findUnsupportedClaims(value: unknown): string[] {
  const text = JSON.stringify(value);
  return blockedPatterns.flatMap((pattern) => {
    const match = pattern.exec(text);
    if (!match) return [];
    const before = text.slice(Math.max(0, match.index - 80), match.index);
    const explicitlyNegated = /(?:\bn[aã]o\b|\bsem\b|\bnunca\b|\bjamais\b)[^.!?]{0,70}$/iu.test(before);
    return explicitlyNegated ? [] : [pattern.source];
  });
}
