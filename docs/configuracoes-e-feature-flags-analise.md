# Configurações e feature flags da análise

As configurações `ai.*` e as flags `ai_profile_analysis`, `ai_profile_summary`, `ai_bio_analysis`, `ai_recommendations`, `ai_content_ideas` e `ai_action_plan_explanation` são criadas desligadas pela migration `202607150008_openai_profile_analysis.sql`. Segredos nunca ficam no painel. `ai.engagement_interpretation_audited=true` reconhece a auditoria formal de `engagement-v2`, mas não ativa a IA. Limites e defaults estão em `docs/integracao-openai.md`.

## Settings tipados

| Chave | Padrão | Validação | Função |
|---|---:|---:|---|
| `analysis.minimum_posts_for_trend` | 6 | 4–50 | amostra cronológica mínima |
| `analysis.minimum_posts_per_format` | 3 | 2–20 | amostra mínima por formato |
| `analysis.minimum_posts_for_caption_comparison` | 3 | 2–20 | mínimo por grupo em comparações |
| `analysis.trend_stable_threshold_percent` | 10 | 1–25 | faixa considerada estável |
| `analysis.trend_relevant_threshold_percent` | 25 | 10–100 | faixa considerada relevante |
| `analysis.maximum_action_items` | 3 | 1–5 | prioridades exibidas |
| `analysis.highlights_audit_enabled` | false | booleano | segunda trava de destaques |
| `analysis.caption_analysis_enabled` | false | booleano | segunda trava de legendas |
| `analysis.hashtag_analysis_enabled` | false | booleano | segunda trava de hashtags |
| `analysis.cta_analysis_enabled` | false | booleano | segunda trava de CTAs |

## Matriz de flags

| Flag | Cálculo/interface | Padrão da migration |
|---|---|---|
| `profile_completeness_analysis` | completude e relação seguidores/seguindo | desligada |
| `content_format_analysis` | diversidade e desempenho por formato | desligada |
| `engagement_stability_analysis` | estabilidade, concentração e regularidade | desligada |
| `recent_trend_analysis` | comparação cronológica | desligada |
| `caption_analysis` | estatísticas de legendas; exige setting | desligada |
| `cta_analysis` | detecção de CTA; exige setting | desligada |
| `hashtag_analysis` | estatísticas de hashtags; exige setting | desligada |
| `highlights_audit` | estado indisponível; exige setting | desligada |
| `deterministic_action_plan` | motor de prioridades | desligada |

As flags são lidas exclusivamente no servidor. Falha no banco usa fallback fechado. Um módulo não calculado não aparece na página e seus campos permanecem opcionais. Habilite gradualmente em ambiente de teste depois de aplicar a migration e validar amostras reais.
