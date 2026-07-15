# Alcance IA

Plataforma brasileira **Alcance IA**: landing page, captura segura, análise determinística de dados públicos do Instagram via ScrapeCreators, resultado individual, contato, consentimento e painel administrativo seguro.

> A análise oficial usa dados públicos e regras transparentes. Uma camada opcional de IA apenas interpreta métricas já calculadas; começa desligada e não substitui o Instagram Insights.

## Tecnologias

- Next.js 16 com App Router, React 19 e TypeScript
- Tailwind CSS 4, complementado por tokens visuais em `src/app/globals.css`
- Supabase (PostgreSQL e estrutura preparada para Auth)
- Zod para validação no servidor
- Vitest para testes unitários
- Vercel Web Analytics e Speed Insights, condicionados ao consentimento analítico
- Vercel como destino de hospedagem

## Estrutura principal

```text
src/
├── app/                 # páginas, metadata, SEO e rotas HTTP
├── components/          # admin, analytics, análise, cookies, forms, layout, legal, sections e UI
├── config/              # marca e dados institucionais configuráveis
└── lib/                 # analytics, cookies, segurança, Supabase e validações
supabase/migrations/     # esquema PostgreSQL e RLS
public/                  # manifest e ativos públicos
```

## Instalação e execução local

Requer Node.js 20.9 ou superior e npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Abra `http://localhost:3000`. Sem Supabase configurado, as páginas funcionam normalmente e os formulários exibem um erro controlado ao tentar persistir dados.

## Comandos de validação

```bash
npm run test
npm run lint
npm run typecheck
npm run build
```

## Variáveis de ambiente

Copie `.env.example` para `.env.local`. Nunca envie `.env.local` ao Git.

| Variável | Finalidade |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | URL canônica, local ou publicada |
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave pública, reservada a usos futuros com RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave privada usada somente nas rotas do servidor |
| `FORM_PROTECTION_SECRET` | Assinatura HMAC dos tokens de tempo dos formulários; mínimo de 32 caracteres em produção |
| `RATE_LIMIT_HASH_SECRET` | HMAC que pseudonimiza o endereço usado pelo limitador |
| `RATE_LIMIT_BACKEND` | `memory` somente local; use `supabase` em Preview e Production |
| `*_RATE_LIMIT_MAX` / `*_RATE_LIMIT_WINDOW_SECONDS` | Limites configuráveis por rota |
| `ANALYSIS_DEDUP_WINDOW_SECONDS` | Janela de deduplicação por sessão e perfil |
| `ANALYSIS_RETENTION_DAYS` | Prazo inicial das solicitações anônimas |
| `ADMIN_EXPORT_MAX_ROWS` | Limite de linhas por CSV administrativo; entre 1 e 5000 |
| `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` | Google Analytics, condicionado ao consentimento |
| `NEXT_PUBLIC_CLARITY_ID` | Microsoft Clarity opcional, condicionado ao consentimento e com formulários mascarados |
| `NEXT_PUBLIC_META_PIXEL_ID` | Preparação para Meta Pixel |
| `NEXT_PUBLIC_PINTEREST_TAG_ID` | Preparação para Pinterest Tag |
| `NEXT_PUBLIC_REDDIT_PIXEL_ID` | Preparação para Reddit Pixel |
| `RESEND_API_KEY` | Notificação opcional de novos contatos |
| `CONTACT_EMAIL` | Destino de contato e informação institucional |
| `TURNSTILE_SECRET_KEY` | Preparação para validação do Turnstile no servidor |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Preparação para widget do Turnstile |
| `OPENAI_API_KEY` | Chave privada da OpenAI, somente no servidor |
| `OPENAI_MODEL` | Modelo configurável usado pela Responses API |
| `OPENAI_TIMEOUT_MS` / `OPENAI_MAX_OUTPUT_TOKENS` | Limites de tempo e saída |
| `OPENAI_AI_ANALYSIS_ENABLED` | Controle de ambiente; começa `false` |

Variáveis vazias não ativam integrações. `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` e `TURNSTILE_SECRET_KEY` nunca podem ser prefixadas com `NEXT_PUBLIC_`.

## Configuração do Supabase

1. Abra o projeto Supabase existente.
2. Acesse o SQL Editor.
3. Revise e aplique as migrations de `supabase/migrations` em ordem. A migration `202607150006_advanced_analysis_metrics.sql` permanece local até autorização explícita e cria campos versionados, settings e flags avançadas desligadas.
4. Preencha URL, chave anon e chave `service_role` no ambiente local e na Vercel.
5. Teste o formulário da Home e o formulário de contato.

As migrations criam as tabelas, validações, RLS, idempotência, limitador distribuído e rotinas de deduplicação e expiração. Não existe política pública de leitura ou escrita. `authenticated` recebe somente leitura de solicitações cujo `user_id` corresponda a `auth.uid()`; as gravações públicas passam pelas rotas do servidor.

## Segurança e proteção contra abuso

- validação e normalização com Zod no servidor;
- `service_role` isolada por `server-only`;
- rate limit distribuído no PostgreSQL em produção, com memória apenas no desenvolvimento;
- identificador do limitador pseudonimizado com HMAC, sem armazenar IP bruto;
- honeypot, token assinado de tempo mínimo e Turnstile opcional;
- idempotência por envio e deduplicação temporal atômica;
- mensagens de erro sem detalhes internos;
- cabeçalhos de segurança no Next.js;
- entradas com limites de tamanho;
- sem coleta de senha do Instagram.

Em produção, configure `RATE_LIMIT_BACKEND=supabase`. O modo `memory` falha de forma fechada em produção porque instâncias serverless não compartilham memória. O Turnstile é opcional, mas as duas chaves devem ser configuradas juntas.

## Cookies e analytics

O banner permite aceitar todos, rejeitar não essenciais ou configurar as categorias essenciais, funcionais, analíticas e marketing. A escolha versionada, com timestamp, fica em `localStorage` e pode ser reaberta pelo rodapé. GA4, Clarity, Vercel Web Analytics e Speed Insights só são carregados após consentimento analítico e ignoram identificadores vazios.

Os eventos do funil são tipados e passam por uma única função, que remove propriedades não permitidas e evita duplicação. A atribuição preserva first touch e last touch; somente o first touch é enviado nos campos UTM atuais da solicitação. Consulte `docs/analytics-e-funil.md` para a taxonomia completa e as fórmulas.

GA4 é a arquitetura principal; GTM não é carregado em paralelo. Meta, Pinterest e Reddit permanecem interfaces futuras e inativas. Antes de ativá-los, conecte cada adaptador à categoria de marketing e valide a revogação do consentimento.

## Resend (opcional e futuro)

O contato é sempre salvo primeiro no Supabase. Se `RESEND_API_KEY` e `CONTACT_EMAIL` estiverem preenchidos, a rota tenta enviar uma notificação. Antes de produção, verifique o domínio no Resend e substitua o remetente provisório `onboarding@resend.dev` por um endereço do domínio.

## Painel administrativo

O painel em `/admin` usa Supabase Auth, RLS e autorização repetida no servidor. Não existe cadastro público de administradores. Após aplicar a migration do painel, associe manualmente o primeiro usuário Auth a `super_admin` conforme [docs/criacao-primeiro-administrador.md](docs/criacao-primeiro-administrador.md).

Documentação:

- [arquitetura e operação do painel](docs/painel-administrativo.md);
- [aplicação segura da migration](docs/aplicacao-migrations-painel.md);
- [matriz de permissões](docs/matriz-de-permissoes.md).

O painel controla somente uma lista fechada de configurações, flags e conteúdos. Segredos continuam exclusivamente nas variáveis de ambiente.

## Publicação na Vercel

1. No projeto existente da Vercel, conecte ou importe este repositório GitHub.
2. Confirme o framework Next.js e o comando `npm run build`.
3. Cadastre as variáveis de ambiente necessárias em Development, Preview e Production.
4. Faça o deploy e valide os formulários com o Supabase configurado.
5. Em **Domains**, adicione `alcance.ia.br` e, se utilizado, `www.alcance.ia.br`.
6. Copie os registros DNS indicados pela Vercel para o painel do Registro.br.
7. Escolha o domínio canônico e configure o outro como redirecionamento permanente.
8. Aguarde a propagação e teste HTTPS, sitemap, robots e URLs canônicas.

O código não configura domínio nem altera serviços externos automaticamente.

## Conteúdo e identidade

- Textos das páginas: arquivos `page.tsx` em `src/app`.
- Nome, descrição, contato e dados jurídicos: `src/config/site.ts`.
- Logo temporário: `src/components/ui/logo.tsx`.
- Cores, raios, sombras, espaçamentos e largura: variáveis no início de `src/app/globals.css`.
- Nova página: crie `src/app/nova-rota/page.tsx`, exporte `metadata` e adicione ao sitemap se for pública.

Os placeholders jurídicos (`[CNPJ A DEFINIR]`, por exemplo) são intencionais. Não publique comercialmente sem preenchimento e revisão profissional.

## SEO, acessibilidade e performance

Há metadata por página, canônicas, Open Graph/Twitter, manifest, sitemap, robots, HTML semântico, FAQ estruturado, 404 própria e `noindex` nas rotas de processamento, resultado, login, cadastro e obrigado. A interface usa Server Components por padrão, foco visível, labels, mensagens acessíveis e respeito a `prefers-reduced-motion`.

## Limitações atuais

- a fonte depende da disponibilidade pública e dos limites da ScrapeCreators;
- a amostra coletada não representa necessariamente todo o histórico da conta;
- a IA assistiva começa desligada; não analisa comentários, imagem, áudio, concorrentes nem recalcula métricas;
- destaques ainda não são coletados e não causam chamadas adicionais;
- cadastro apenas visual para registro de interesse, sem coleta de senha ou criação de conta;
- sem pagamentos, planos, créditos ou painel do usuário final;
- o banco remoto precisa receber as migrations versionadas antes de ativar os formulários em produção;
- templates jurídicos exigem revisão profissional;
- GA4 e Clarity dependem de configuração manual; pixels de marketing permanecem inativos.

## Próximos passos recomendados

1. Revisar textos e documentos jurídicos com profissionais responsáveis.
2. Ativar Supabase em ambientes Preview e Production e executar a migration.
3. Ativar MFA/AAL2 para administradores e validar os cinco papéis com usuários de teste.
4. Definir uma fonte de dados autorizada e compatível com as políticas do Instagram.
5. Implementar fila assíncrona e estados reais de análise.
6. Configurar Turnstile e monitoramento operacional em produção.
7. Verificar domínio de e-mail no Resend.
8. Configurar GA4, habilitar os painéis da Vercel e validar eventos com consentimento em produção.

## Análise determinística avançada

A versão `v2.0.0` centraliza métricas puras em `src/lib/analysis/metrics`, persiste JSONB versionado e permite recálculo administrativo sem API. Todas as novas flags começam desligadas e falhas de configuração usam fallback fechado. Consulte [métricas e fórmulas](docs/metricas-avancadas-deterministicas.md), [regras do plano](docs/regras-do-plano-de-acao.md), [dicionário](docs/dicionario-de-metricas.md), [processamento](docs/processamento-da-analise.md) e [settings/flags](docs/configuracoes-e-feature-flags-analise.md).

## Interpretação assistida pela OpenAI

A integração server-only usa Responses API, Structured Outputs, prompt/schema versionados, pacote sanitizado, cache, consumo e verificações de consistência. Ela permanece desativada por padrão e aceita somente a fórmula de engajamento `engagement-v2`, formalmente auditada. Consulte [docs/integracao-openai.md](docs/integracao-openai.md).

## Catálogo de recursos e descoberta

Hashtags e rankings independentes de Reels usam o snapshot já armazenado da análise, sem novas chamadas. O catálogo central controla acesso público, gratuito, premium e administrativo, além de estado, visibilidade, limites, dependências e custo estimado. Descoberta e tendências permanecem desligadas até a homologação de endpoints. Consulte [catálogo](docs/catalogo-de-recursos.md), [controle e planos](docs/controle-de-recursos-e-planos.md), [metodologia](docs/metodologia-dos-rankings.md) e [descoberta por categoria](docs/hashtags-e-reels-por-categoria.md).
