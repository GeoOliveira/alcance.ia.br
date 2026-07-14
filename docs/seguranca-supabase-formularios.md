# Segurança do Supabase e dos formulários

## Escopo e estado auditado

Esta fase protege a captura de análise, o contato e o cadastro demonstrativo. Não implementa análise do Instagram, autenticação completa ou serviços comerciais. A inspeção considerou o relatório da fase 1, os clientes Supabase, as rotas, os formulários e as migrations locais.

O banco remoto não foi consultado nem alterado. Não é possível afirmar que seu estado coincide com os arquivos do repositório; a divergência deve ser verificada com `supabase migration list` e `supabase db push --dry-run` antes de qualquer aplicação.

## Arquitetura de segurança

- O navegador usa apenas variáveis `NEXT_PUBLIC_*`; a chave `service_role` é importada exclusivamente por `admin.ts`, marcado como `server-only`.
- Formulários enviam JSON para Route Handlers. Não há escrita direta do navegador nas tabelas.
- Cada corpo passa por limite em bytes, parser JSON e schema Zod no servidor.
- Cada formulário obtém um token HMAC vinculado ao tipo do formulário. O servidor verifica assinatura, validade e tempo mínimo.
- Honeypot e Turnstile opcional complementam a proteção. Nenhuma dessas camadas é usada isoladamente.
- O rate limiting de produção usa um contador atômico no PostgreSQL. Apenas uma HMAC do endereço chega ao banco; IP e user agent completos não são persistidos.
- A chave de idempotência evita duplo clique e reenvio. Solicitações de análise também são deduplicadas, sob lock transacional, por sessão anônima e perfil durante uma janela configurável.
- Respostas incluem `X-Request-Id`, nunca retornam erro SQL, stack trace, segredo ou nome de tabela. Logs contêm apenas operação, request ID, classe da falha, código interno curto e timestamp.

## Fluxo dos formulários

1. A página solicita `GET /api/form-token?form=...`, protegido por rate limit.
2. O cliente mantém uma chave UUID de idempotência durante tentativas do mesmo envio.
3. No POST, a rota limita taxa, tamanho e tipo do corpo; valida e normaliza os campos; rejeita honeypot; valida token de tempo e Turnstile.
4. Análise e contato gravam com `service_role`. O cadastro continua demonstrativo e responde 503 sem salvar dados.
5. A análise usa a função `create_analysis_request_secure`, que combina idempotência e deduplicação temporal atomicamente.

Limites atuais: análise 4 KiB, contato 8 KiB e cadastro 4 KiB. O nome do Instagram aceita usuário ou URL canônica de perfil, rejeitando outros domínios e caminhos como posts, Reels ou Stories.

## RLS e privilégios

As tabelas `analysis_requests` e `contact_messages` têm RLS habilitado. `anon` não possui SELECT, INSERT, UPDATE ou DELETE. Contatos não possuem política pública. Para uso futuro com Supabase Auth, `authenticated` recebe SELECT em `analysis_requests`, mas a policy permite somente linhas em que `auth.uid() = user_id`. Não há policy ampla `using (true)` ou `with check (true)`.

As funções de rate limit, criação segura e expiração são `security definer`, fixam `search_path` vazio e concedem execução apenas a `service_role`. A tabela de contadores fica no schema `private`, sem acesso de `anon` ou `authenticated`.

## Migrations

- `202607130001_initial_capture.sql`: schema inicial, checks, índices, trigger de atualização e RLS fechado.
- `202607140002_form_security.sql`: chaves de idempotência e índices únicos, limites de colunas e metadata, contador distribuído, RPC de deduplicação, policy do próprio usuário e função de expiração.

Aplicação controlada:

```bash
supabase link --project-ref SEU_PROJECT_REF
supabase migration list
supabase db push --dry-run
supabase db push
```

Faça backup e aplique primeiro em Preview/Staging. Revise o `--dry-run`; não use `db reset` no remoto. Esta implementação não executou nenhum desses comandos contra o projeto remoto.

## Variáveis de ambiente

Obrigatórias em produção: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `FORM_PROTECTION_SECRET`, `RATE_LIMIT_HASH_SECRET` e `RATE_LIMIT_BACKEND=supabase`. Gere os dois segredos com pelo menos 32 caracteres e valores distintos.

Configuração de proteção: `FORM_MIN_SUBMIT_MS`, `FORM_TOKEN_MAX_AGE_SECONDS`, `ANALYSIS_DEDUP_WINDOW_SECONDS`, `ANALYSIS_RETENTION_DAYS` e os pares `ANALYSIS_*`, `CONTACT_*`, `SIGNUP_*` e `FORM_TOKEN_*` de rate limit.

Turnstile é ativado somente quando `NEXT_PUBLIC_TURNSTILE_SITE_KEY` e `TURNSTILE_SECRET_KEY` são configuradas juntas. `RESEND_API_KEY` e `CONTACT_EMAIL` são opcionais; sem elas, o contato continua salvo, apenas sem notificação.

Nunca prefixe a chave administrativa, segredos HMAC, chave do Resend ou segredo Turnstile com `NEXT_PUBLIC_`.

## Cabeçalhos e CSP

O Next.js envia CSP, `Referrer-Policy`, `X-Content-Type-Options`, `Permissions-Policy`, proteção contra framing e COOP. HSTS e `upgrade-insecure-requests` são habilitados apenas em produção. A CSP libera somente as origens usadas pelo próprio app, Supabase configurado, provedores analíticos já presentes e Cloudflare Turnstile. `unsafe-inline` permanece para compatibilidade com scripts/estilos atuais do Next.js e integrações existentes; `unsafe-eval` é restrito ao desenvolvimento. A evolução recomendada é adotar nonce quando a renderização dinâmica justificar o custo.

## Retenção

Novas solicitações anônimas recebem `expires_at` conforme `ANALYSIS_RETENTION_DAYS` (30 dias por padrão). `mark_expired_analysis_requests` marca registros vencidos em lotes, sem exclusão. Use `supabase/scripts/mark-expired-analysis-requests.sql` para inspecionar candidatos e executar a marcação deliberadamente.

Um cron futuro pode chamar a função com `service_role`, após aprovação de política operacional. Exclusão ou anonimização definitiva deve ser documentada, testada em backup e aprovada antes de automatização.

## Testes manuais

1. Sem Supabase, confirme erro 503 genérico e ausência de detalhes de configuração.
2. Com as migrations em Preview, envie análise e contato válidos e confira apenas uma linha por envio.
3. Clique duas vezes ou repita a mesma chave e confirme a mesma solicitação/retorno 200.
4. Repita até receber 429 com `Retry-After`.
5. Preencha o honeypot via DevTools e confirme rejeição genérica.
6. Envie imediatamente após buscar o token e confirme rejeição por tempo mínimo.
7. Ative as duas chaves Turnstile e teste sucesso, token ausente e token expirado.
8. Teste URL de outro domínio e URL de post/Reel; ambas devem falhar antes do banco.
9. Confirme no Supabase, usando os papéis `anon` e `authenticated`, que contatos não podem ser lidos e que solicitações alheias não são visíveis.
10. Inspecione CSP e demais headers no ambiente publicado e o console do navegador para origens realmente necessárias.

## Checklist antes do deploy

- Aplicar migrations em Preview/Staging, executar os testes manuais e só então promover para produção.
- Cadastrar todas as variáveis na Vercel por ambiente; usar `RATE_LIMIT_BACKEND=supabase` fora do desenvolvimento.
- Configurar as duas chaves Turnstile juntas e cadastrar os domínios permitidos no Cloudflare.
- Confirmar que nenhuma chave real está no Git e rotacionar qualquer segredo que tenha sido exposto anteriormente.
- Validar RLS e grants no painel Supabase; manter `service_role` apenas no servidor.
- Definir responsável, frequência e evidência de execução da rotina de expiração.
- Configurar alertas para aumento de 429, 5xx e falhas de notificação sem coletar corpos ou PII.

## Riscos remanescentes

- O estado remoto pode divergir das migrations locais até a verificação manual.
- O rate limit baseado no endereço de origem pode agrupar usuários atrás do mesmo NAT e depende dos headers normalizados pela plataforma de hospedagem.
- O `service_role` ignora RLS; uma falha em rota de servidor continua sendo relevante, por isso as funções aceitam dados limitados e as rotas mantêm validação própria.
- Turnstile não protege enquanto as duas chaves não forem configuradas.
- CSP ainda permite script e estilo inline por compatibilidade; qualquer nova origem deve passar por revisão.
- A notificação Resend usa remetente provisório até o domínio ser verificado.
- Expiração não significa exclusão: a política de descarte definitivo ainda exige decisão jurídica e operacional.
