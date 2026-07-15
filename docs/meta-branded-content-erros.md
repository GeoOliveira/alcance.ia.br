# Matriz de erros — Meta Branded Content Search

| Código | HTTP | Retry | Tratamento |
|---|---:|---:|---|
| `META_CONFIGURATION` | 503 | não | configuração ausente |
| `META_AUTHENTICATION` | 502 | não | token inválido/expirado |
| `META_PERMISSION` | 502 | não | permissão negada |
| `META_RATE_LIMIT` | 429 | não | limite do provedor |
| `META_VALIDATION` | 400 | não | parâmetros recusados |
| `META_NOT_FOUND` | 404 | não | entidade indisponível |
| `META_TIMEOUT` | 504 | sim | timeout |
| `META_INVALID_RESPONSE` | 502 | não | JSON/schema inválido |
| `META_PROVIDER` | 502 | apenas 5xx | falha temporária |

Há no máximo uma repetição. O corpo bruto nunca é retornado ou persistido; telemetria guarda código interno e duração.
