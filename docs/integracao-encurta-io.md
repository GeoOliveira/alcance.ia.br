# Integração Encurta.io × Alcance IA

## Contrato consultado

O contrato foi conferido no projeto local Encurta.io 2, em `docs/openapi/internal-v1.yaml`, `docs/integracao-alcance-ia-api-privada.md`, `docs/assinatura-hmac.md`, `docs/idempotencia.md`, `docs/erros-api-interna.md` e na implementação da rota `src/app/api/internal/v1/links/route.ts`.

Endpoint: `POST /api/internal/v1/links` em `https://encurta.io`. Criação retorna `201`; replay idempotente retorna `200`. A API aceita somente `destinationType: whatsapp`, telefone, mensagem opcional, metadados de acesso e identificadores externos.

Headers obrigatórios: Bearer, `X-Integration-Source`, `X-Request-Id`, `X-Timestamp`, `X-Signature` e `Content-Type: application/json`.

## Assinatura e idempotência

`X-Signature` é `sha256=<hex>` usando HMAC-SHA256 sobre:

```text
timestamp
POST
/api/internal/v1/links
requestId
sha256(raw_body)
```

O mesmo request ID, corpo e destino são reutilizados em timeout, falha de rede e 5xx. Conflitos 409 não são repetidos automaticamente.

## Integração na Alcance

O cliente server-only está em `src/lib/integrations/encurta`. A rota pública interna é `POST /api/whatsapp-links/shorten`; ela aceita apenas `phone`, `message` e `requestId`, valida novamente o telefone, gera o link oficial e nunca funciona como proxy genérico.

O navegador nunca recebe credenciais nem chama o Encurta.io. O link oficial é mostrado imediatamente e permanece disponível quando o encurtamento falha. O link curto só é aceito após validação de host e slug. O contrato aceita slugs alfanuméricos de 4 a 32 caracteres: novas URLs usam 4 caracteres por padrão, enquanto links antigos maiores continuam válidos.

## Estado inicial

`ENCURTA_INTEGRATION_ENABLED=false`, `encurta_integration=false` e `whatsapp_link_shortener=false`. Sem credenciais e sem flags ativas, nenhuma chamada externa é realizada.
