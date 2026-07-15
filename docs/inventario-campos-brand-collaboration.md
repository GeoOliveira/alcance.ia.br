# Inventário de campos do Brand Collaboration Scraper

Campos documentados em 15/07/2026 — ainda não observados em dataset real:

| Campo | Tipo documentado | Normalização |
|---|---|---|
| `id` | `string \| null` | `providerItemId`; nunca usado como ID público isoladamente |
| `dateCreated` | `string \| null` | ISO ou `null` |
| `creator` | `object \| null` | nome, link HTTPS e username defensivo |
| `brandPartners` | `object[] \| null` | entidades normalizadas |
| `type` | `string \| null` | valor original e label segura |
| `link` | `string \| null` | HTTPS validada ou `null` |

Campos extras são ignorados pelo contrato público. A resposta é tratada como `unknown`, validada com Zod e não é persistida integralmente. Fixtures reais sanitizadas permanecem pendentes da prova autorizada.
