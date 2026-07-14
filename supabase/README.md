# Supabase da Alcance IA

O diretório contém a representação versionada do banco. O estado remoto não foi lido nem alterado nesta fase; portanto, confirme o projeto alvo e compare o histórico antes de aplicar qualquer migration.

## Ordem das migrations

1. `202607130001_initial_capture.sql`: tabelas de solicitações e contatos, restrições iniciais e RLS fechado.
2. `202607140002_form_security.sql`: idempotência, limites adicionais, política de leitura do próprio usuário, rate limiting distribuído, deduplicação atômica e marcação de expirados.

Com a Supabase CLI instalada e autenticada:

```bash
supabase link --project-ref SEU_PROJECT_REF
supabase migration list
supabase db push --dry-run
supabase db push
```

Não execute `db reset` em um projeto remoto. Faça backup, revise o `--dry-run` e aplique primeiro em Preview/Staging. Depois, confira no painel que RLS está ativo e que `anon` não possui privilégios nas duas tabelas.

O script `scripts/mark-expired-analysis-requests.sql` lista candidatos antes de marcar registros expirados. Ele não apaga dados automaticamente.
