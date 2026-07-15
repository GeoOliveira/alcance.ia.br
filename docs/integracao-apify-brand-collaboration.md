# Integração Apify Brand Collaboration

Actor: `apify/brand-collaboration-scraper`. A integração usa `apify-client` em um cliente único e `server-only`. A página pública nunca recebe token, Actor ID, run ID, dataset ID ou `startUrls`.

## Estado de validação em 15/07/2026

Foram conferidos no catálogo oficial do Actor o schema de entrada, o schema de saída e o preço anunciado. Não foi realizada uma execução real: não existe `APIFY_API_TOKEN` local e o Console não estava autenticado. Portanto, a integração permanece desabilitada por ambiente, setting e flag até uma prova manual autorizada.

Entrada confirmada: `startUrls` obrigatório; `resultsLimit` inteiro mínimo 1; `onlyPostsNewerThan` e `onlyPostsOlderThan` em data absoluta ou relativa. A Alcance IA aceita somente datas absolutas e sempre define limite.

Referências: [Actor](https://apify.com/apify/brand-collaboration-scraper), [JavaScript API](https://apify.com/apify/brand-collaboration-scraper/api/javascript), [input](https://apify.com/apify/brand-collaboration-scraper/input-schema) e [output](https://apify.com/apify/brand-collaboration-scraper/output-schema).

## Configuração

Defina os valores server-only descritos no `.env.example`. Comece com `APIFY_BRAND_COLLABORATION_ENABLED=false`. Depois de aplicar a migration local, habilite setting e flag somente para teste administrativo; mantenha `branded_content.apify_allow_public_usage=false`.

## Prova manual pendente

1. Entrar no Apify Console e adicionar o Actor.
2. Gerar uma URL real na Biblioteca de Conteúdo de Marca da Meta.
3. Executar Instagram com limite 5 e datas absolutas.
4. Repetir para Facebook se a interface gerar URL compatível.
5. Registrar duração, quantidade, custo e dataset sanitizado.
6. Atualizar fixtures e este documento antes de qualquer uso público.
