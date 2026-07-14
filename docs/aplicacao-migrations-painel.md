# Aplicação da migration do painel

A migration `202607140003_admin_panel.sql` não é aplicada automaticamente. Execute apenas depois de revisar o projeto Supabase vinculado, ter backup e possuir uma janela segura.

## Pré-requisitos

- Supabase CLI autenticada.
- Repositório na versão que contém a migration.
- Projeto correto vinculado; referência esperada confirmada no painel.
- Backup recente ou Point-in-Time Recovery compatível com o plano.
- Migrations `202607130001` e `202607140002` já presentes no remoto.

## Procedimento

No diretório do projeto:

```powershell
npx supabase@latest projects list
npx supabase@latest migration list
npx supabase@latest db push --dry-run
```

O dry run deve listar somente:

```text
202607140003_admin_panel.sql
```

Revise o arquivo e, quando estiver seguro, aplique:

```powershell
npx supabase@latest db push
npx supabase@latest migration list
```

Não use `db reset` contra o projeto remoto. A mensagem sobre Docker ao cachear o catálogo não invalida uma migration já concluída, mas o resultado deve ser confirmado com `migration list`.

## Verificação pós-migration

No painel do Supabase, confirme:

1. as seis tabelas administrativas existem;
2. RLS está habilitado nelas;
3. `analysis_requests` e `contact_messages` possuem os novos campos;
4. funções `current_admin_role`, `is_admin`, `has_admin_role` e RPCs administrativas existem;
5. seeds de configurações, flags, conteúdo e FAQ foram inseridos;
6. `anon` não tem políticas administrativas;
7. não existe perfil administrativo criado automaticamente.

Depois, siga `docs/criacao-primeiro-administrador.md`. Teste primeiro login, logout, permissões, uma alteração reversível de conteúdo e o evento correspondente em auditoria.

## Reversão

Não há rollback destrutivo automático. Em caso de falha, interrompa a ativação do painel, preserve evidências e restaure pelo mecanismo de backup do Supabase ou prepare uma migration corretiva revisada. Não apague tabelas ou histórico manualmente em produção.
