begin;

alter table public.analysis_results
  add column if not exists metrics_version text,
  add column if not exists calculated_metrics jsonb,
  add column if not exists calculation_status text not null default 'legacy',
  add column if not exists calculation_started_at timestamptz,
  add column if not exists calculation_completed_at timestamptz,
  add column if not exists calculation_error text;

alter table public.analysis_results drop constraint if exists analysis_results_metrics_version_check;
alter table public.analysis_results add constraint analysis_results_metrics_version_check
  check (metrics_version is null or char_length(metrics_version) between 1 and 20);
alter table public.analysis_results drop constraint if exists analysis_results_calculated_metrics_check;
alter table public.analysis_results add constraint analysis_results_calculated_metrics_check
  check (calculated_metrics is null or (jsonb_typeof(calculated_metrics) = 'object' and pg_column_size(calculated_metrics) <= 262144));
alter table public.analysis_results drop constraint if exists analysis_results_calculation_status_check;
alter table public.analysis_results add constraint analysis_results_calculation_status_check
  check (calculation_status in ('legacy','complete','partial','failed','unavailable'));
alter table public.analysis_results drop constraint if exists analysis_results_calculation_error_check;
alter table public.analysis_results add constraint analysis_results_calculation_error_check
  check (calculation_error is null or char_length(calculation_error) <= 100);

create index if not exists analysis_results_metrics_version_idx on public.analysis_results (metrics_version, calculation_status);

insert into public.app_settings (key,value,value_type,category,label,description,is_public,validation_schema) values
  ('analysis.minimum_posts_for_trend','6','number','analysis','Amostra mínima para tendência','Mínimo de publicações com data para dividir períodos equivalentes.',false,'{"min":4,"max":50}'),
  ('analysis.minimum_posts_per_format','3','number','analysis','Amostra mínima por formato','Mínimo de conteúdos antes de comparar desempenho por formato.',false,'{"min":2,"max":20}'),
  ('analysis.minimum_posts_for_caption_comparison','3','number','analysis','Amostra para comparação textual','Mínimo por grupo em comparações de legendas e hashtags.',false,'{"min":2,"max":20}'),
  ('analysis.trend_stable_threshold_percent','10','number','analysis','Limiar de estabilidade','Variação percentual abaixo da qual a tendência é estável.',false,'{"min":1,"max":25}'),
  ('analysis.trend_relevant_threshold_percent','25','number','analysis','Limiar de variação relevante','Variação percentual considerada relevante.',false,'{"min":10,"max":100}'),
  ('analysis.maximum_action_items','3','number','analysis','Máximo de prioridades','Quantidade máxima de prioridades principais do plano determinístico.',false,'{"min":1,"max":5}'),
  ('analysis.highlights_audit_enabled','false','boolean','analysis','Auditoria de destaques','Controle administrativo adicional; não cria coleta de destaques.',false,'{}'),
  ('analysis.caption_analysis_enabled','false','boolean','analysis','Análise de legendas','Controle administrativo adicional da análise textual determinística.',false,'{}'),
  ('analysis.hashtag_analysis_enabled','false','boolean','analysis','Análise de hashtags','Controle administrativo adicional da análise de hashtags.',false,'{}'),
  ('analysis.cta_analysis_enabled','false','boolean','analysis','Análise de CTAs','Controle administrativo adicional da detecção conservadora de CTAs.',false,'{}')
on conflict (key) do nothing;

insert into public.feature_flags (key,name,description,enabled,scope) values
  ('profile_completeness_analysis','Completude do perfil','Calcula critérios fixos de completude do perfil.',false,'public'),
  ('content_format_analysis','Formatos e desempenho','Calcula diversidade e desempenho por formato.',false,'public'),
  ('engagement_stability_analysis','Estabilidade e concentração','Calcula dispersão e concentração das interações.',false,'public'),
  ('recent_trend_analysis','Tendência recente','Compara grupos cronológicos equivalentes de publicações.',false,'public'),
  ('caption_analysis','Estrutura das legendas','Calcula estatísticas descritivas das legendas.',false,'public'),
  ('cta_analysis','Chamadas para ação','Detecta padrões conservadores de CTA em português.',false,'public'),
  ('hashtag_analysis','Uso de hashtags','Calcula padrão, diversidade e concentração de hashtags.',false,'public'),
  ('highlights_audit','Auditoria de destaques','Permanece indisponível até existir coleta autorizada e cacheada.',false,'public'),
  ('deterministic_action_plan','Plano de ação determinístico','Gera prioridades com evidência a partir das métricas habilitadas.',false,'public')
on conflict (key) do nothing;

comment on column public.analysis_results.calculated_metrics is 'Métricas determinísticas versionadas calculadas apenas a partir de dados normalizados persistidos.';
comment on column public.analysis_results.calculation_error is 'Código técnico sanitizado; nunca contém resposta do fornecedor ou dados pessoais.';

commit;
