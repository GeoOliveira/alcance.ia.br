begin;

alter table public.analysis_results
  add column if not exists engagement_formula_version text,
  add column if not exists engagement_calculated_at timestamptz,
  add column if not exists metrics_history jsonb not null default '[]'::jsonb;

alter table public.analysis_results drop constraint if exists analysis_results_engagement_formula_version_check;
alter table public.analysis_results add constraint analysis_results_engagement_formula_version_check
  check (engagement_formula_version is null or char_length(engagement_formula_version) between 1 and 30);
alter table public.analysis_results drop constraint if exists analysis_results_metrics_history_check;
alter table public.analysis_results add constraint analysis_results_metrics_history_check
  check (jsonb_typeof(metrics_history) = 'array' and pg_column_size(metrics_history) <= 262144);

create index if not exists analysis_results_engagement_formula_version_idx
  on public.analysis_results (engagement_formula_version, engagement_calculated_at desc);

insert into public.app_settings (key,value,value_type,category,label,description,is_public,validation_schema) values
  ('analysis.engagement_max_posts','20','number','analysis','Máximo de posts no engajamento','Limite de publicações recentes consideradas antes da validação de curtidas e comentários.',false,'{"min":3,"max":100}'),
  ('analysis.engagement_max_age_days','90','number','analysis','Janela do engajamento','Idade máxima, em dias, das publicações consideradas.',false,'{"min":7,"max":365}'),
  ('analysis.engagement_minimum_posts','3','number','analysis','Amostra mínima do engajamento','Publicações válidas mínimas para apresentar uma classificação.',false,'{"min":3,"max":12}')
on conflict (key) do nothing;

comment on column public.analysis_results.engagement_formula_version is 'Versão da fórmula principal de engajamento persistida independentemente da versão dos módulos avançados.';
comment on column public.analysis_results.metrics_history is 'Até dez snapshots anteriores preservados por recálculos administrativos sem chamadas externas.';

commit;
