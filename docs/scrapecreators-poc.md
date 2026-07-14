# Prova de conceito ScrapeCreators

## Objetivo e limites

Esta POC permite a administradores estudar respostas reais de perfis públicos do Instagram sem alterar a Home, o formulário público ou o relatório demonstrativo. Os resultados são técnicos e não constituem análise oficial da Alcance IA. Comentários, transcrição, destaques, hashtags, busca, tendências, concorrentes e IA permanecem fora do escopo.

## Arquitetura

O código em `src/lib/social-providers` define contratos internos e isola a ScrapeCreators. `scrape-creators/client.ts` é o único cliente HTTP: usa `fetch` no servidor, `x-api-key`, timeout, `AbortSignal`, limite de 2 MB, validação de status/JSON, duração e no máximo um retry para 500/502/503/504. Schemas Zod tolerantes validam perfil, posts, Reels e detalhes; o mapper converte respostas para contratos próprios e conserva a resposta original apenas após sanitização.

Endpoints oficiais integrados:

| Operação | Método e caminho | Parâmetros principais | Crédito estimado |
|---|---|---|---:|
| Perfil | `GET /v1/instagram/profile` | `handle`, `trim=false` | 1 |
| Posts | `GET /v2/instagram/user/posts` | `handle`, `next_max_id`, `trim=false` | 1/página |
| Reels | `GET /v1/instagram/user/reels` | `handle`, `max_id`, `trim=false` | 1/página |
| Detalhe | `GET /v1/instagram/post` | `url`, `trim=false`, `download_media=false` | 1 |

Referência: [documentação oficial da ScrapeCreators](https://docs.scrapecreators.com/). O download permanente de mídia fica explicitamente desativado porque custa créditos adicionais.

## Segurança e permissões

`SCRAPECREATORS_API_KEY` só é lida em módulos com `server-only`; não é retornada, registrada ou persistida. Respostas removem chaves sensíveis, headers/tokens e query strings de URLs de CDN, limitando o JSON persistido a 200 KB. A área `/admin/integracoes/scrapecreators` herda autenticação, `noindex` e bloqueio em robots. Apenas `super_admin` e `admin` recebem permissões de leitura, execução e exportação; exclusão é exclusiva de `super_admin`.

A execução exige simultaneamente: `SCRAPECREATORS_POC_ENABLED=true`, setting `scrapecreators.poc_enabled=true`, feature flag `scrapecreators_poc=true` e permissão administrativa. A chave nunca é armazenada no painel.

## Contratos, validação e campos

`InstagramProfile` distingue `null` de zero e inclui identificadores, nome, bio, imagem, URL, contagens e flags. `InstagramPost` inclui tipo, legenda, data, métricas, mídia, carrossel, hashtags, menções, local e áudio. Campos desconhecidos permanecem apenas na resposta bruta. O inventário registra encontrados, ausentes, nulos, tipos inesperados e raízes desconhecidas.

## Cache, paginação e consumo

A chave lógica é fornecedor + endpoint + identificador normalizado + máximo de páginas. TTLs padrão: perfil/posts/Reels 30 minutos; detalhe 60 minutos. Um cache hit reaproveita a execução existente, custa zero e faz zero chamadas. A tela usa uma página por padrão, respeita o máximo administrativo, para sem cursor e preserva páginas já recebidas na resposta de execução. Cada chamada, retry e crédito estimado são registrados. O limite diário conta execuções sem cache.

## Banco, retenção e auditoria

A migration `202607140004_scrapecreators_poc.sql` cria `provider_test_runs`, cinco índices, RLS, policies, settings e a feature flag. `anon` e `authenticated` não podem inserir; somente o servidor com service role insere após autorizar a sessão. A resposta bruta é opcional e expira em 7 dias; o normalizado em 30. `supabase/scripts/scrapecreators-expired-data.sql` apenas identifica expirados e mantém a limpeza comentada para revisão manual.

Execução, cache/force refresh, exportação e exclusão geram eventos em `admin_audit_logs`. Mudanças de settings e feature flags já usam a auditoria do painel.

## Configuração e uso

1. Defina na Vercel, separadamente por ambiente, `SCRAPECREATORS_API_KEY`, `SCRAPECREATORS_BASE_URL=https://api.scrapecreators.com`, `SCRAPECREATORS_TIMEOUT_MS=20000` e `SCRAPECREATORS_POC_ENABLED=true`. Marque a chave como sensível e não use prefixo `NEXT_PUBLIC_`.
2. Aplique manualmente a migration, por exemplo com Supabase CLI devidamente vinculado: `supabase db push`. Revise o diff antes; este repositório não a aplica remotamente automaticamente.
3. No painel, ative o setting `scrapecreators.poc_enabled` e depois a flag `scrapecreators_poc` (esta última exige `super_admin`).
4. Acesse `/admin/integracoes/scrapecreators`, selecione Perfil, informe manualmente um usuário público de teste, mantenha uma página e cache ativado, e execute.
5. Consulte a execução pelo histórico. Exporte JSON normalizado, inventário CSV ou relatório JSON pela tela protegida.

Para desativar imediatamente, torne falso qualquer um dos três controles. Recomenda-se primeiro desligar `SCRAPECREATORS_POC_ENABLED` na Vercel.

## Testes e limitações conhecidas

Os testes automatizados usam mocks e não consomem créditos. Cobrem configuração/chave, timeout, JSON/status inválidos, 401/403/404/429/500, política de retry, mapeamento, ausências/nulos, validação de entrada, sanitização e tamanho. Cache, limite diário e autorização também são impostos no serviço e nas policies; a validação integrada requer Supabase local com a migration.

Segundo a documentação do fornecedor, posts incluem Reels; o endpoint de Reels pode não trazer fixados nem descrição; play counts podem divergir de contagens combinadas Instagram/Facebook; campos dependem do que o Instagram expõe. Esses pontos devem ser confirmados com testes manuais de perfis pequeno, médio, grande, privado e inexistente, além de foto, Reel e carrossel. Nenhum nome real é fixado nos testes.
