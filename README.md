# Alcance IA

Primeira fase da plataforma brasileira **Alcance IA**: landing page institucional, captura segura de solicitações de análise do Instagram, fluxo demonstrativo de processamento e resultado, cadastro visual, contato, consentimento de cookies, páginas institucionais e jurídicas.

> Esta versão não consulta o Instagram, não executa IA e não gera uma análise real. Telas de resultado são identificadas como demonstração.

## Tecnologias

- Next.js 16 com App Router, React 19 e TypeScript
- Tailwind CSS 4, complementado por tokens visuais em `src/app/globals.css`
- Supabase (PostgreSQL e estrutura preparada para Auth)
- Zod para validação no servidor
- Vitest para testes unitários
- Vercel como destino de hospedagem

## Estrutura principal

```text
src/
├── app/                 # páginas, metadata, SEO e rotas HTTP
├── components/          # analytics, análise, cookies, forms, layout, legal, sections e UI
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
| `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` | Google Analytics, condicionado ao consentimento |
| `NEXT_PUBLIC_GOOGLE_TAG_MANAGER_ID` | Preparação para GTM |
| `NEXT_PUBLIC_CLARITY_ID` | Preparação para Microsoft Clarity |
| `NEXT_PUBLIC_META_PIXEL_ID` | Preparação para Meta Pixel |
| `NEXT_PUBLIC_PINTEREST_TAG_ID` | Preparação para Pinterest Tag |
| `NEXT_PUBLIC_REDDIT_PIXEL_ID` | Preparação para Reddit Pixel |
| `RESEND_API_KEY` | Notificação opcional de novos contatos |
| `CONTACT_EMAIL` | Destino de contato e informação institucional |
| `TURNSTILE_SECRET_KEY` | Preparação para validação do Turnstile no servidor |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Preparação para widget do Turnstile |

Variáveis vazias não ativam integrações. `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` e `TURNSTILE_SECRET_KEY` nunca podem ser prefixadas com `NEXT_PUBLIC_`.

## Configuração do Supabase

1. Abra o projeto Supabase existente.
2. Acesse o SQL Editor.
3. Execute `supabase/migrations/202607130001_initial_capture.sql` ou aplique com a Supabase CLI (`supabase db push`) após vincular o projeto.
4. Preencha URL, chave anon e chave `service_role` no ambiente local e na Vercel.
5. Teste o formulário da Home e o formulário de contato.

A migration cria `analysis_requests` e `contact_messages`, índices, validações e atualização automática de `updated_at`. RLS é habilitado e todos os privilégios de `anon` e `authenticated` são revogados. Não existe política pública de leitura ou inserção. Somente rotas no servidor usam `service_role`. Quando o Supabase Auth for implementado, novas políticas autenticadas e específicas deverão ser adicionadas.

## Segurança e proteção contra abuso

- validação e normalização com Zod no servidor;
- `service_role` isolada por `server-only`;
- rate limit básico em memória por impressão hash do IP, sem armazenar IP bruto;
- honeypot em formulários públicos;
- mensagens de erro sem detalhes internos;
- cabeçalhos de segurança no Next.js;
- entradas com limites de tamanho;
- sem coleta de senha do Instagram.

O limitador em memória é adequado apenas como primeira camada. Em produção com múltiplas funções serverless, substitua-o por um limitador distribuído e ative Cloudflare Turnstile.

## Cookies e analytics

O banner permite aceitar todos, rejeitar não essenciais ou configurar as categorias essenciais, funcionais, analíticas e marketing. A escolha fica em `localStorage` e pode ser reaberta pelo rodapé. A camada de analytics não injeta Google Analytics antes do consentimento analítico e ignora identificadores vazios.

Os eventos preparados estão tipados em `src/lib/analytics/events.ts`: `page_view`, `hero_cta_click`, `analysis_form_started`, `analysis_request_submitted`, `analysis_preview_viewed`, `signup_started`, `signup_completed`, `contact_form_submitted`, `cookie_consent_updated`, `login_clicked` e `legal_page_viewed`.

Antes de ativar novos pixels, conecte cada adaptador à categoria correta e valide a revogação do consentimento.

## Resend (opcional e futuro)

O contato é sempre salvo primeiro no Supabase. Se `RESEND_API_KEY` e `CONTACT_EMAIL` estiverem preenchidos, a rota tenta enviar uma notificação. Antes de produção, verifique o domínio no Resend e substitua o remetente provisório `onboarding@resend.dev` por um endereço do domínio.

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

- nenhuma consulta ou integração com Instagram;
- nenhuma análise de perfil, conteúdo ou métricas;
- nenhuma IA, geração de conteúdo ou automação;
- cadastro apenas visual; senha validada e descartada, sem persistência;
- sem pagamentos, planos, créditos ou painel;
- rate limit local, não distribuído;
- templates jurídicos exigem revisão profissional;
- integrações de analytics adicionais permanecem desacopladas e inativas.

## Próximos passos recomendados

1. Revisar textos e documentos jurídicos com profissionais responsáveis.
2. Ativar Supabase em ambientes Preview e Production e executar a migration.
3. Implementar Supabase Auth e políticas RLS vinculadas ao usuário.
4. Definir uma fonte de dados autorizada e compatível com as políticas do Instagram.
5. Implementar fila assíncrona e estados reais de análise.
6. Adicionar rate limit distribuído, Turnstile e monitoramento.
7. Verificar domínio de e-mail no Resend.
8. Conectar analytics progressivamente após testes de consentimento.
