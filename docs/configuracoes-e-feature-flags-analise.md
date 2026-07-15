# Configurações e feature flags da análise

As configurações `ai.*` e as flags de IA são criadas desligadas pela migration `202607150008_openai_profile_analysis.sql`. A migration `202607150009_public_analysis_flow.sql` prepara as flags das subseções, mas mantém `ai_profile_analysis=false`; portanto, nenhuma chamada ocorre sem a ativação deliberada dos três controles mestres. Segredos nunca ficam no painel. `ai.engagement_interpretation_audited=true` reconhece a auditoria formal de `engagement-v2`, mas não ativa a IA. Limites e defaults estão em `docs/integracao-openai.md`.

## Settings tipados

| Chave | Padrão | Validação | Função |
|---|---:|---:|---|
| `analysis.minimum_posts_for_trend` | 6 | 4–50 | amostra cronológica mínima |
| `analysis.minimum_posts_per_format` | 3 | 2–20 | amostra mínima por formato |
| `analysis.minimum_posts_for_caption_comparison` | 3 | 2–20 | mínimo por grupo em comparações |
| `analysis.trend_stable_threshold_percent` | 10 | 1–25 | faixa considerada estável |
| `analysis.trend_relevant_threshold_percent` | 25 | 10–100 | faixa considerada relevante |
| `analysis.maximum_action_items` | 3 | 1–5 | prioridades exibidas |
| `analysis.highlights_audit_enabled` | true após 009 | booleano | segunda trava de destaques |
| `analysis.caption_analysis_enabled` | true após 009 | booleano | segunda trava de legendas |
| `analysis.hashtag_analysis_enabled` | true após 009 | booleano | segunda trava de hashtags |
| `analysis.cta_analysis_enabled` | true após 009 | booleano | segunda trava de CTAs |

## Matriz de flags

| Flag | Cálculo/interface | Padrão da migration |
|---|---|---|
| `profile_completeness_analysis` | completude e relação seguidores/seguindo | ativa após 009 |
| `content_format_analysis` | diversidade e desempenho por formato | ativa após 009 |
| `engagement_stability_analysis` | estabilidade, concentração e regularidade | ativa após 009 |
| `recent_trend_analysis` | comparação cronológica | ativa após 009 |
| `caption_analysis` | estatísticas de legendas; exige setting | ativa após 009 |
| `cta_analysis` | detecção de CTA; exige setting | ativa após 009 |
| `hashtag_analysis` | estatísticas de hashtags; exige setting | ativa após 009 |
| `highlights_audit` | estado indisponível; exige setting | ativa após 009 |
| `deterministic_action_plan` | motor de prioridades | ativa após 009 |

As flags são lidas exclusivamente no servidor. Falha no banco usa fallback fechado. Um módulo não calculado não aparece na página nem deixa um link sem destino na navegação. Os módulos determinísticos não criam chamadas adicionais à ScrapeCreators.
