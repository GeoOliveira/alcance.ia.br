# Painel administrativo da Alcance IA

## Visão geral

O painel é uma área separada em `/admin`, baseada em Supabase Auth, Server Components, Server Actions e RLS. Ele não usa a chave `service_role` para operações administrativas: cada consulta é executada com a sessão do administrador e submetida às políticas do PostgreSQL. A chave privilegiada permanece restrita às leituras públicas centralizadas e às rotas públicas de captura já existentes.

O painel não oferece SQL, migrations, variáveis da Vercel, segredos, HTML ou JavaScript arbitrário. Todas as chaves editáveis são predefinidas e validadas com Zod.

## Arquitetura

- `src/proxy.ts` e `src/lib/supabase/proxy.ts`: renovação da sessão e primeira barreira para `/admin`.
- `src/lib/admin/auth.ts`: DAL de sessão e autorização repetida no servidor.
- `src/lib/admin/permissions.ts`: matriz fechada de funções e permissões.
- `src/app/admin/actions`: autenticação e mutações administrativas.
- `src/lib/admin/data.ts`: consultas paginadas, filtros e dashboard.
- `src/lib/settings`: leitura pública tipada, defaults, cache e disponibilidade operacional.
- `src/components/admin`: navegação, feedback, tabelas, paginação e diálogos acessíveis.
- `supabase/migrations/202607140003_admin_panel.sql`: tabelas, índices, funções, RLS e seeds.

## Rotas

| Rota | Finalidade |
|---|---|
| `/admin/login` | Login público apenas para autenticação administrativa |
| `/admin/recuperar-senha` | Solicitação e conclusão da recuperação de senha |
| `/admin` | Indicadores e atividade recente |
| `/admin/solicitacoes` e `/[id]` | Busca, filtros, detalhes, status, notas, anonimização e exclusão |
| `/admin/contatos` e `/[id]` | Atendimento, mensagem, status, notas e exclusão |
| `/admin/conteudo/home` | Campos selecionados da Home |
| `/admin/conteudo/faq` | Criação, edição, ordenação, ativação e exclusão de FAQ |
| `/admin/configuracoes` | Lista fechada de configurações operacionais |
| `/admin/funcionalidades` | Feature flags conhecidas |
| `/admin/usuarios` | Associação e gestão de perfis administrativos |
| `/admin/auditoria` | Últimos eventos administrativos permitidos |
| `/admin/perfil` | Perfil e recuperação de senha do administrador atual |
| `/admin/api/export/*` | CSV autorizado, limitado, filtrado e auditado |

O layout administrativo define `noindex,nofollow`, não aparece no sitemap, foi adicionado ao `robots.txt` e não renderiza menus públicos.

## Autenticação e sessão

O login usa e-mail e senha do Supabase Auth. Após autenticar, a aplicação confirma que existe um `admin_profiles` ativo, registra o último login e cria o evento de auditoria. Mensagens são genéricas e o destino pós-login só aceita caminhos internos iniciados por `/admin`.

O proxy renova cookies de sessão. Páginas e ações repetem a autorização no servidor; o proxy nunca é a única barreira. Desativar um perfil revoga o acesso na próxima verificação. Logout, recuperação e sessão expirada são tratados sem revelar se um e-mail possui perfil administrativo.

O MFA não está ativado nesta versão. Próximo passo recomendado: exigir AAL2 no Supabase Auth para `super_admin` e ações destrutivas.

## Dados e RLS

As tabelas administrativas são `admin_profiles`, `app_settings`, `feature_flags`, `site_content`, `site_faqs` e `admin_audit_logs`. A migration também adiciona notas e campos de anonimização a solicitações e contatos.

RLS é habilitado em todas as tabelas administrativas. `anon` não recebe leitura ou escrita. Funções auxiliares `current_admin_role`, `is_admin` e `has_admin_role` são `security definer`, têm `search_path` vazio e derivam a identidade de `auth.uid()`, evitando recursão. Políticas específicas limitam cada tabela por função. Logs não possuem política de update/delete. Perfis administrativos não podem ser apagados fisicamente, e um trigger impede remover o último `super_admin` ativo.

Exclusão e anonimização são RPCs transacionais restritas ao `super_admin`. A anonimização substitui perfil e sessão e limpa usuário, UTMs, referrer, landing page, metadata e observações; o evento de auditoria permanece.

## Configurações, cache e analytics

`getPublicSettings()` lê somente registros `is_public`, valida o conjunto e usa defaults seguros se a tabela estiver indisponível ou inválida. IDs públicos válidos do banco prevalecem; valores vazios mantêm o fallback das variáveis de ambiente. O booleano de ativação pode desligar a integração mesmo com fallback configurado.

`analytics.environment` aceita `production`, `preview`, `development` ou `all`. GA4, Clarity, Vercel Analytics e Speed Insights continuam condicionados ao consentimento; IDs nunca são tratados como segredos.

Configurações, conteúdo, FAQ e flags usam cache de 300 segundos com tags distintas. Server Actions invalidam a tag e revalidam as páginas relevantes após uma alteração confirmada e auditada.

## Modo de manutenção e flags

O modo de manutenção é ativado por `maintenance.enabled` ou pela flag `maintenance_mode`. Páginas jurídicas e o painel permanecem acessíveis. As demais páginas mostram título, mensagem e contato; APIs públicas e emissão de tokens de formulário retornam `503` controlado. Não há redirecionamento, portanto não há loop.

Flags iniciais: `instagram_analysis`, `analysis_preview`, `user_signup`, `google_login`, `email_login`, `contact_form`, `public_faq`, `maintenance_mode` e `content_generation`. Flags de recursos ainda inexistentes ficam desativadas e não criam interface por si mesmas.

## Conteúdo e FAQ

A Home consome apenas campos sem HTML de `site_content`: hero, chamada principal, segurança, benefícios, CTA final, indisponibilidade e confiança. FAQ aceita texto simples, posição e status. Tamanhos e markup perigoso são bloqueados no cliente, Zod e constraints do banco.

## Auditoria

São registrados login, logout, autorização negada com sessão válida, configurações, manutenção, conteúdo, FAQ, status e notas, flags, exportações, perfis, anonimizações e exclusões. O sanitizador remove chaves que possam conter senha, token, segredo, cookie, autorização, e-mail, nome ou mensagem. Conteúdo integral de contatos não entra nos logs.

## Exportação

CSV exige permissão e confirmação digitada, é gerado no servidor, respeita os filtros atuais e usa `ADMIN_EXPORT_MAX_ROWS` (1 a 5000; padrão 1000). Campos iniciados por `=`, `+`, `-` ou `@` recebem proteção contra execução de fórmulas. Analistas recebem o perfil minimizado na exportação de solicitações.

## Segurança operacional

- IDs são validados antes das consultas de detalhe e mutações.
- Queries selecionam colunas necessárias e usam paginação de 20 itens.
- Ações críticas pedem palavra digitada em `<dialog>` acessível.
- Segredos não aparecem em tabelas, formulários, logs ou HTML.
- A `service_role` nunca é prefixada com `NEXT_PUBLIC_`.
- Erros de autenticação e autorização não revelam existência de usuários.
- Cabeçalhos/cookies/tokens/IP bruto não são exibidos no painel.

## Testes e validação

Há testes para permissões, validação, redirects seguros, sanitização de auditoria, configuração e fallback, disponibilidade/manutenção, conteúdo controlado, CSV injection e contrato de segurança da migration. As rotas públicas continuam usando mocks, sem tocar o banco de produção.

Execute:

```bash
npm install
npm run lint
npm run typecheck
npm test
npm run build
```

## Limitações

- A migration precisa ser aplicada antes de o painel funcionar.
- O primeiro usuário Auth e seu perfil `super_admin` são criados manualmente.
- Não há MFA obrigatório, convites por e-mail, retenção automática de logs ou sessão administrativa com prazo próprio.
- O dashboard usa consultas limitadas; para grande volume, migre agregações para funções/materializações dedicadas.
- O papel `analyst` recebe métricas permitidas no dashboard e exportação minimizada, mas não abre detalhes individuais; ampliar essa visão exige uma RPC paginada minimizada.
- Alterações e auditoria em ações comuns são duas operações; as ações destrutivas são atômicas no banco. Uma futura revisão pode mover todas as mutações para RPCs transacionais.
- `content_generation`, logins públicos e análise real continuam fora do escopo.

## Próximos passos

1. Aplicar a migration em ambiente controlado e executar o checklist pós-migration.
2. Criar o primeiro `super_admin` pelo procedimento documentado.
3. Validar os cinco papéis com usuários de teste antes de produção.
4. Exigir MFA/AAL2 para funções privilegiadas.
5. Criar testes de integração contra um Supabase local descartável.
6. Definir retenção e exportação segura dos logs de auditoria.
# Painel administrativo

O grupo **Conteúdo** reúne SEO de páginas, FAQ e campos da Home. O dashboard usa somente dados registrados e configuração já disponível, sem health checks caros durante a renderização. Consulte `gerenciamento-seo-admin.md`, `menu-admin-conteudo.md` e `melhorias-dashboard-admin.md` para a operação atual.
