# Supabase da Alcance IA

O diretório contém a representação versionada do banco. O estado remoto não foi lido nem alterado nesta fase; portanto, confirme o projeto alvo e compare o histórico antes de aplicar qualquer migration.

## Ordem das migrations

1. `202607130001_initial_capture.sql`: tabelas de solicitações e contatos, restrições iniciais e RLS fechado.
2. `202607140002_form_security.sql`: idempotência, limites adicionais, política de leitura do próprio usuário, rate limiting distribuído, deduplicação atômica e marcação de expirados.
3. `202607140003_admin_panel.sql`: perfis administrativos, configurações, flags, conteúdo, FAQ, auditoria, RPCs críticas, índices e RLS por função.
4. `202607140004_scrapecreators_poc.sql`: execução administrativa controlada da fonte social.
5. `202607140005_analysis_results.sql`: contratos normalizados e métricas determinísticas.
6. `202607150006_advanced_analysis_metrics.sql`: métricas avançadas versionadas.
7. `202607150007_engagement_metric_audit.sql`: fórmula auditada `engagement-v2` e histórico.
8. `202607150008_openai_profile_analysis.sql`: execuções estruturadas da OpenAI, settings/flags desligados, índices e RLS.
9. `202607150009_public_analysis_flow.sql`: ativa os módulos determinísticos públicos e prepara as subseções de IA sem ligar seu controle mestre.
10. `202607150010_activate_public_ai_insights.sql`: ativa o controle mestre e a visibilidade pública completa dos Insights inteligentes.

Com a Supabase CLI instalada e autenticada:

```bash
supabase link --project-ref SEU_PROJECT_REF
supabase migration list
supabase db push --dry-run
supabase db push
```

Não execute `db reset` em um projeto remoto. Faça backup, revise o `--dry-run` e aplique primeiro em Preview/Staging. Depois, confira no painel que RLS está ativo e que `anon` não possui privilégios nas duas tabelas.

Os scripts `scripts/mark-expired-analysis-requests.sql` e `scripts/openai-expired-data.sql` listam candidatos antes de qualquer mutação. A limpeza de IA permanece comentada e exige revisão manual.

Para o painel, leia `docs/aplicacao-migrations-painel.md` antes do push e `docs/criacao-primeiro-administrador.md` depois da aplicação. A migration não cria usuários nem perfis administrativos automaticamente. Não conceda `service_role` ao navegador ou ao painel.
