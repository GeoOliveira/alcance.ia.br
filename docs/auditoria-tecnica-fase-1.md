# Auditoria técnica — fase 1

**Projeto:** Alcance IA

**Data:** 14 de julho de 2026

**Branch e revisão inspecionadas:** `main`, base `a5824a3`
**Escopo:** versão local existente; nenhuma alteração externa em Vercel, Supabase, DNS ou produção

## Resumo executivo

A aplicação usa corretamente o Next.js App Router, TypeScript estrito e Server Components por padrão. As páginas públicas carregaram sem erro, não apresentaram rolagem horizontal nas larguras testadas e possuem uma base consistente de metadata, navegação, consentimento e validação no servidor. A chave administrativa do Supabase está isolada em módulo `server-only`, os formulários não inserem diretamente pelo navegador e nenhum segredo real foi encontrado no repositório ou no diff.

Foram corrigidas falhas objetivas de baixo risco: URLs de posts, reels e stories eram aceitas como perfis; o cadastro coletava uma senha sem haver autenticação; a API de interesse retornava sucesso sem persistir dado algum; o menu móvel permanecia aberto em parte das navegações; o painel de cookies não recebia nem continha o foco; páginas `noindex` herdavam a canonical da Home; a rota dinâmica aceitava cadeias que não eram UUIDs; o rodapé inteiro era enviado como Client Component; e páginas jurídicas geravam um `id` duplicado.

Não há bloqueio de lint, TypeScript, testes ou build. Permanecem riscos importantes que exigem decisão ou infraestrutura: dados jurídicos ainda são placeholders, o fluxo de interesse não possui persistência, o rate limit é apenas local, não há deduplicação de solicitações, o Supabase configurado externamente não foi exercitado e o `npm audit` relata duas ocorrências moderadas em uma dependência transitiva do Next.js.

## Tecnologias encontradas

| Tecnologia | Versão instalada / configuração |
|---|---|
| Node.js | 22.17.0 no ambiente auditado; README exige 20.9+ |
| npm | 10.9.2 |
| Next.js | 16.2.10, App Router, Turbopack no build |
| React / React DOM | 19.2.4 |
| TypeScript | 5.9.3, `strict: true`, `noEmit: true`, resolução `bundler` |
| Tailwind CSS | 4.3.2, via PostCSS; estilos principais em `globals.css` |
| Supabase JS | 2.110.3 |
| Supabase SSR | 0.8.0 |
| Zod | 4.4.3 |
| ESLint | 9.39.5, regras Next core-web-vitals e TypeScript |
| Vitest | 4.1.10 |
| Hospedagem declarada | Vercel; não acessada nem alterada |

O `package.json` fixa Next/React e usa intervalos para outras bibliotecas. `npm outdated` encontrou versões mais recentes de Supabase, React, ESLint, tipos e TypeScript, mas nenhuma atualização ampla foi feita nesta fase.

## Estrutura atual

- `src/app`: páginas App Router, três Route Handlers, metadata, 404, sitemap e robots.
- `src/components`: componentes separados entre análise, analytics, cookies, formulários, layout, jurídico, seções e UI.
- `src/config`: marca, URL, contato, dados jurídicos e navegação.
- `src/lib`: analytics/UTM, consentimento, rate limit, clientes Supabase e validações.
- `supabase/migrations`: schema inicial de `analysis_requests` e `contact_messages`, índices, trigger, RLS e revogação de privilégios públicos.
- `public`: manifest, imagem social e cinco SVGs do starter do Next.js sem uso.

O alias `@/* -> ./src/*` funciona. Todas as páginas são Server Components. Client Components estão limitados às áreas interativas; o rodapé deixou de ser um Client Component e agora contém somente um pequeno botão-cliente para reabrir cookies.

Arquivos relativamente grandes, mas ainda administráveis: `globals.css` (~21 KB) e a Home (~8 KB). Muitos arquivos usam JSX compactado em uma única linha, o que não quebra o build, mas reduz legibilidade e qualidade de revisão.

## Problemas críticos

Nenhum problema crítico foi confirmado. Não foi encontrado segredo real, `service_role` no bundle do navegador, acesso público às tabelas ou falha de build.

## Problemas altos

### Corrigidos

1. **Cadastro coletava senha sem autenticação.** A senha era transmitida ao servidor, validada e descartada. A coleta foi removida do formulário, payload e schema.
2. **Falso sucesso no registro de interesse.** `/api/signup-interest` devolvia `202` e a interface dizia “Interesse registrado”, embora nenhum nome/e-mail fosse persistido. O endpoint agora responde `503` de forma explícita, sem alegar persistência. Implementar armazenamento continua fora do escopo.
3. **URLs de conteúdo do Instagram aceitas como perfil.** `/p/...`, `/reel/...`, `/stories/...` e caminhos adicionais eram reduzidos ao primeiro segmento e passavam pela validação. A URL agora precisa conter exatamente um segmento válido de perfil.

### Não corrigidos

1. **Identificação jurídica incompleta.** Nome empresarial, CNPJ, endereço e encarregado permanecem placeholders. Publicação comercial depende de preenchimento e revisão jurídica humana.
2. **Proteção contra abuso não distribuída.** O `Map` em memória não coordena instâncias serverless e perde estado em reinícios. Turnstile está apenas preparado e inativo. Antes de tráfego real, usar um limitador distribuído e ativar proteção anti-bot.
3. **Ambiente Supabase real não validado.** Sem variáveis locais, não foi possível confirmar migration aplicada, schema remoto, permissões efetivas ou gravação real. Nenhuma ação externa foi autorizada ou realizada.

## Problemas médios

- Não há deduplicação de `analysis_requests`; envios repetidos criam linhas distintas quando o banco estiver ativo.
- `anonymous_session_id` é um UUID novo por solicitação, não um identificador estável de sessão; isso limita deduplicação e análise de jornada.
- A imagem `public/og.png` tem aproximadamente 1,0 MB. Uma tentativa lossless foi descartada após inspeção visual detectar alteração de perfil de cor; o ativo original foi preservado. Recomenda-se otimização controlada pela equipe de design.
- Não há `error.tsx`/`global-error.tsx`. As páginas estáticas têm baixo risco, mas erros inesperados dependem do fallback padrão do Next.js.
- Não existe Content Security Policy. Os cabeçalhos atuais incluem proteção contra MIME sniffing, framing, referrer excessivo, permissões sensíveis e isolamento de opener. CSP precisa ser desenhada junto das integrações externas.
- `AnalyticsLoader` lê consentimento apenas na montagem. Aceitar ou revogar analytics durante a sessão não atualiza o loader; eventos tipados também não possuem consumidor ativo. Como integrações de marketing estão fora desta fase, isso foi somente documentado.
- Os módulos `src/lib/supabase/client.ts` e `server.ts` e a dependência `@supabase/ssr` não participam do fluxo atual; parecem preparação para Auth. Não foram removidos para preservar a arquitetura planejada.
- Os SVGs `file.svg`, `globe.svg`, `next.svg`, `vercel.svg` e `window.svg` não têm referências. São resíduos do starter, mas foram mantidos para evitar remoção sem decisão do responsável.
- O formulário de contato tenta Resend após persistir no banco e ignora falhas de envio. O contato permanece gravado, porém não há telemetria ou retentativa para a notificação.
- O `npm audit` encontrou duas ocorrências moderadas associadas ao PostCSS transitivo empacotado no Next.js. A sugestão automática oferece downgrade incompatível para Next 9.3.3; não foi aplicada.

## Melhorias de baixa prioridade

- Formatar os arquivos JSX/TSX hoje compactados para facilitar revisão e manutenção.
- Separar `mainNavigation` do objeto de configuração que também lê variável somente de servidor, reduzindo acoplamento conceitual no grafo cliente.
- Remover ativos do starter e módulos preparados apenas quando a direção de Auth/SSR estiver confirmada.
- Adicionar testes de Route Handlers com mocks de Supabase e cenários de banco, sem iniciar uma suíte E2E ampla.
- Definir uma política de atualização de dependências e revisar a migração futura de `@supabase/ssr` 0.8 para a linha atual.
- Considerar ícones PWA dedicados em tamanhos padrão; o manifest hoje reutiliza o favicon ICO com `sizes: any`.

## Correções realizadas

- Validação e normalização robustas de usuário/URL do Instagram.
- Rejeição explícita de caminhos de posts, reels, stories, áreas internas e múltiplos segmentos.
- Mensagens portuguesas para entrada vazia e excessivamente longa.
- `maxLength=300` e `aria-describedby` coerente no campo principal.
- Novos testes unitários para normalização, nome de usuário e URL de perfil.
- Remoção da coleta/transmissão de senha no cadastro demonstrativo.
- Resposta honesta `503` no interesse não persistido e textos ajustados para demonstração.
- Validação estrita de UUID na rota dinâmica.
- Canonical própria nas páginas `noindex` e na rota dinâmica.
- Menu móvel com nome acessível dinâmico, fechamento em todos os links e tecla Escape.
- Painel de cookies com descrição associada, foco inicial, contenção de Tab/Shift+Tab e restauração de foco.
- Rodapé convertido novamente em Server Component, isolando o botão interativo.
- Remoção de `id="conteudo"` duplicado nas páginas jurídicas.
- Correção da dimensão declarada da imagem social de 1733 para os 1731 pixels reais.
- README atualizado para refletir a ausência de coleta de senha e criação de conta.

## Correções não realizadas

- Nenhuma migration, tabela, política RLS ou variável externa foi alterada.
- Persistência do cadastro de interesse não foi criada.
- Auth, Instagram API, IA, painel, pagamentos e marketing não foram implementados.
- Rate limit distribuído, Turnstile, CSP e observabilidade não foram adicionados.
- Placeholders jurídicos não foram inventados nem preenchidos.
- Dependências não foram atualizadas ou substituídas.
- Não houve refatoração ampla, redesign ou remoção dos arquivos do starter.

## Riscos de segurança

### Pontos positivos

- `SUPABASE_SERVICE_ROLE_KEY` é lida apenas em `src/lib/supabase/admin.ts`, protegido por `server-only`.
- O navegador usa somente variáveis `NEXT_PUBLIC_*`; nenhuma chave administrativa aparece em Client Component.
- `.env.local` e demais `.env*` são ignorados; `.env.example` contém apenas valores vazios/locais.
- Nenhum arquivo `.env` real é rastreado e nenhum segredo foi encontrado no diff.
- Há validação Zod no servidor, honeypot nos formulários persistentes, limites de tamanho e erros sem detalhes sensíveis.
- O banco declarado habilita RLS e revoga privilégios de `anon` e `authenticated`.

### Pendências

- Rate limit em memória é insuficiente para serverless e pode ser contornado entre instâncias.
- Não há CSP; avaliar também HSTS no domínio publicado e não apenas no ambiente local.
- Referrer e landing page são truncados, mas não passam por validação semântica de URL/caminho antes de armazenamento.
- Logs registram somente códigos do Supabase, o que reduz vazamento, mas também limita diagnóstico.
- As chaves/URLs reais da Vercel e o histórico remoto de segredos não foram acessados; se já houve segredo versionado no passado, é necessária revisão de histórico e rotação manual.

## Riscos relacionados ao Supabase

- Clientes existentes: administrador com `service_role`; browser/server com chave anon, atualmente sem consumidores no fluxo.
- Formulários de análise e contato chamam Route Handlers; não existe insert direto pelo navegador.
- `analysis_requests` recebe username normalizado, URL canônica do perfil, UTMs conhecidas, referrer, landing page, metadata, UUIDs e expiração de 30 dias.
- `contact_messages` recebe nome, e-mail, assunto, mensagem, aceite de privacidade e status.
- Erros de insert são tratados com resposta genérica e log somente do código.
- RLS e revogações estão corretas na migration local, mas sua aplicação no projeto remoto não foi comprovada.
- Não há unique constraint/deduplicação de solicitações.
- O prazo `expires_at` não implica exclusão automática; é necessária rotina futura de limpeza/anonimização.
- O cadastro de interesse não tem tabela nem persistência e agora informa indisponibilidade.

## Riscos de SEO

- Título, descrição, `metadataBase`, Open Graph, Twitter, favicon, manifest, robots e sitemap estão presentes.
- Páginas institucionais e jurídicas têm canonical própria e permanecem indexáveis.
- Login, cadastro, obrigado, processamento e resultado usam `noindex, nofollow`; suas canonicals deixaram de apontar para a Home.
- A 404 retorna HTTP 404 e recebe `noindex` automaticamente pelo Next.js.
- Sitemap contém somente as nove páginas públicas adequadas.
- `robots.txt` bloqueia APIs e rotas privadas/demonstrativas.
- A imagem social existe e sua dimensão declarada foi corrigida, mas o peso permanece alto.
- A preferência entre `www` e domínio raiz não é imposta pelo código. Deve ser configurada como redirecionamento permanente na Vercel/DNS e conferida após publicação.
- A Home ainda usa linguagem comercial de “analisar” no CTA. Embora os avisos e a página de resultado identifiquem a demonstração, recomenda-se revisão editorial humana para eliminar qualquer expectativa residual de análise real.

## Riscos de acessibilidade

- Todas as páginas renderizadas possuem exatamente um `h1`; a hierarquia subsequente é coerente.
- Campos têm labels; erros usam `role=alert`; sucesso de contato usa `role=status`; foco visível global está configurado.
- Skip link, landmarks, nomes de navegação e botões acessíveis estão presentes.
- FAQ funciona com botões e `aria-expanded`.
- Menu móvel funciona por teclado, tem nome Abrir/Fechar e fecha com Escape.
- O diálogo de cookies agora recebe e contém foco e possui nome/descrição associados.
- Foi removido o `id` duplicado entre o alvo global do skip link e o conteúdo jurídico.
- Não foi feita auditoria automatizada de contraste por ferramenta dedicada; a inspeção dos tokens não revelou contraste obviamente ilegível. Validar WCAG com axe/Lighthouse antes da produção.
- A composição visual da Home é um `div` rotulado, não uma imagem; elementos decorativos internos podem gerar algum ruído em tecnologias assistivas. Avaliar ocultação sem perder informação útil.

## Riscos de performance

- Conteúdo principal é renderizado no servidor; páginas inteiras não usam `"use client"`.
- Fontes usam `next/font`, evitando carregamento manual incorreto.
- Não há imagens de conteúdo não otimizadas nem scripts externos ativos sem consentimento/configuração.
- O rodapé deixou de puxar sua árvore estática para o bundle cliente.
- A imagem OG de ~1,0 MB é o principal ativo pesado, embora não participe do carregamento visual normal da página.
- `globals.css` centraliza ~21 KB de CSS e a Home concentra ~8 KB de JSX; aceitável nesta fase, mas devem ser monitorados conforme o produto crescer.
- Animações respeitam `prefers-reduced-motion`; nenhum CLS evidente foi observado no teste visual.

## Formulário principal do Instagram

### Aceito e normalizado

- `usuario`, `@usuario`;
- `instagram.com/usuario`;
- URLs com `http`/`https`, `www`, barra final, query string e fragmento;
- nomes com ponto e sublinhado;
- saída em minúsculas, sem `@`, protocolo, domínio, barras, query ou fragmento.

### Rejeitado

- vazio, HTML/script, espaços internos, caracteres inválidos e mais de 300 caracteres de entrada;
- username com mais de 30 caracteres, ponto inicial/final ou pontos consecutivos;
- outros domínios e caminhos arbitrários;
- `/p/`, `/reel/`, `/reels/`, `/stories/`, `/direct/`, `/explore/` e demais rotas reservadas;
- URL com mais de um segmento de caminho.

A validação determinante ocorre no Route Handler, não apenas no navegador.

## Páginas testadas

| Página/recurso | Resultado |
|---|---|
| `/` | 200, metadata, 1 h1, formulário, FAQ e layout verificados |
| `/como-funciona` | 200 |
| `/recursos` | 200 |
| `/quem-somos` | 200 |
| `/contato` | 200; formulário e labels verificados |
| `/politica-de-privacidade` | 200 |
| `/termos-de-uso` | 200 |
| `/politica-de-cookies` | 200 |
| `/exclusao-de-dados` | 200 |
| `/cadastro` | 200, `noindex`, fluxo demonstrativo identificado |
| `/login` | 200, `noindex`, indisponibilidade identificada |
| `/obrigado` | 200, `noindex` |
| `/resultado` | 200, `noindex`, demonstração identificada |
| `/analisar/<uuid-válido>` | 200, `noindex`, estado de processamento demonstrativo |
| `/analisar/<inválido>` | 404 |
| rota inexistente | 404 e `noindex` |
| `/robots.txt` | 200 e regras coerentes |
| `/sitemap.xml` | 200, nove URLs públicas |
| `/manifest.webmanifest` | 200 |
| `/og.png` e `/favicon.ico` | 200 |

No navegador, todas as páginas foram verificadas a 375 px sem overflow horizontal e sem erro de console. A Home também foi verificada em 320, 375, 768, 1024 e 1440 px, sem overflow, corte do formulário ou botão fora da viewport. Links internos enumerados responderam com o status esperado.

## Comandos executados

```text
git status --short --branch
rg --files / rg (rotas, imports, env, segredos, metadata, headings e CSS)
Get-Content (README, package, configs, código e guias locais do Next.js 16)
npm install
npm run lint
npm run typecheck
npm run test
npm run build
npm audit --json
npm outdated
npm ls --depth=0
npm prune --dry-run
curl / Invoke-WebRequest (status, headers, páginas, assets e Route Handlers locais)
testes locais no navegador nas cinco larguras solicitadas
git diff / git diff --stat / git status
```

A primeira execução final do build encontrou apenas `EBUSY` no arquivo de log aberto pelo servidor local usado nesta própria auditoria. O servidor foi encerrado, o log ignorado foi removido e o mesmo build passou imediatamente. Isso não representa falha do código.

## Resultado das verificações finais

| Verificação | Resultado final |
|---|---|
| Instalação | `npm install` concluído; lockfile sem alteração |
| Lint | passou, zero erros |
| Typecheck | passou, zero erros |
| Testes | 3 arquivos, 40 testes aprovados |
| Build | passou; 21 páginas/recursos gerados, rotas estáticas e dinâmicas reconhecidas |
| Navegador | páginas e breakpoints carregaram sem erro de console/overflow |
| HTTP | páginas públicas 200; inválidas/404 com 404; assets SEO 200 |
| Segredos | nenhum valor real no código ou diff |
| `npm audit` | 2 moderadas, 0 altas, 0 críticas |

## Arquivos alterados pela auditoria

- `README.md`
- `docs/auditoria-tecnica-fase-1.md`
- `src/app/analisar/[requestId]/page.tsx`
- `src/app/api/signup-interest/route.ts`
- `src/app/cadastro/page.tsx`
- `src/app/layout.tsx`
- `src/app/login/page.tsx`
- `src/app/obrigado/page.tsx`
- `src/app/resultado/page.tsx`
- `src/components/cookies/cookie-banner.tsx`
- `src/components/cookies/cookie-preferences-button.tsx`
- `src/components/forms/hero-analysis-form.tsx`
- `src/components/forms/signup-form.tsx`
- `src/components/layout/footer.tsx`
- `src/components/layout/mobile-menu.tsx`
- `src/components/legal/legal-page-layout.tsx`
- `src/lib/validation/forms.ts`
- `src/lib/validation/instagram.test.ts`
- `src/lib/validation/instagram.ts`

Os arquivos não rastreados `supabase/.gitignore` e `supabase/config.toml` já existiam antes da auditoria e foram preservados; não fazem parte das alterações acima.

## Próximos passos recomendados

1. Preencher dados jurídicos reais e obter revisão profissional das páginas legais antes de operação comercial.
2. Definir o comportamento do cadastro de interesse e criar persistência explícita, consentimentos, retenção e testes; somente então trocar o `503` por sucesso.
3. Validar/aplicar a migration no ambiente Supabase autorizado e testar insert, RLS, expiração e tratamento de erro em Preview.
4. Implementar rate limit distribuído, Turnstile e estratégia de deduplicação antes de divulgação pública.
5. Corrigir a vulnerabilidade transitiva quando houver versão compatível do Next.js/PostCSS e atualizar dependências em PR separado.
6. Configurar e verificar redirecionamento canônico entre `www` e domínio raiz, HTTPS/HSTS e variáveis por ambiente na Vercel.
7. Planejar CSP junto das origens de Supabase, analytics e e-mail.
8. Otimizar a imagem OG com pipeline que preserve corretamente seu perfil de cor.
9. Adicionar error boundary, testes dos Route Handlers e auditoria axe/Lighthouse em uma fase dedicada.
10. Revisar a linguagem comercial da Home para garantir que nenhum CTA seja interpretado como análise real já disponível.

## Confirmações de escopo

- Nenhum deploy foi realizado.
- Nenhuma variável da Vercel foi lida ou alterada.
- Nenhum projeto, schema ou política do Supabase foi alterado externamente.
- Nenhum DNS ou domínio foi modificado.
- Nenhuma funcionalidade de Instagram, IA, autenticação, painel ou pagamentos foi implementada.
