begin;

create table if not exists public.ai_analysis_runs (
  id uuid primary key default gen_random_uuid(),
  analysis_result_id uuid not null references public.analysis_results(id) on delete cascade,
  request_id uuid not null references public.analysis_requests(id) on delete cascade,
  provider text not null check (provider = 'openai'),
  model text not null check (char_length(model) between 1 and 100),
  prompt_version text not null check (char_length(prompt_version) between 1 and 50),
  schema_version text not null check (char_length(schema_version) between 1 and 50),
  metrics_version text not null check (char_length(metrics_version) between 1 and 30),
  engagement_formula_version text not null check (char_length(engagement_formula_version) between 1 and 40),
  input_hash text not null check (input_hash ~ '^[a-f0-9]{64}$'),
  input_snapshot jsonb check (input_snapshot is null or (jsonb_typeof(input_snapshot) = 'object' and pg_column_size(input_snapshot) <= 131072)),
  output_snapshot jsonb check (output_snapshot is null or (jsonb_typeof(output_snapshot) = 'object' and pg_column_size(output_snapshot) <= 131072)),
  status text not null check (status in ('processing','completed','retryable_failed','failed','expired')),
  source text not null default 'automatic' check (source in ('automatic','admin')),
  requested_by uuid references auth.users(id) on delete set null,
  provider_response_id text check (provider_response_id is null or char_length(provider_response_id) <= 120),
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  total_tokens integer not null default 0 check (total_tokens >= 0),
  estimated_cost_usd numeric(12,6) check (estimated_cost_usd is null or estimated_cost_usd >= 0),
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  cache_hit boolean not null default false,
  retry_count integer not null default 0 check (retry_count between 0 and 1),
  validation_status text not null default 'not_run' check (validation_status in ('not_run','passed','failed')),
  consistency_status text not null default 'not_run' check (consistency_status in ('not_run','passed','failed')),
  error_code text check (error_code is null or char_length(error_code) <= 80),
  error_message text check (error_message is null or char_length(error_message) <= 300),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_analysis_runs_request_idx on public.ai_analysis_runs (request_id, created_at desc);
create index if not exists ai_analysis_runs_analysis_idx on public.ai_analysis_runs (analysis_result_id, created_at desc);
create index if not exists ai_analysis_runs_status_idx on public.ai_analysis_runs (status, created_at desc);
create index if not exists ai_analysis_runs_cache_idx on public.ai_analysis_runs (input_hash, model, prompt_version, schema_version, created_at desc) where status = 'completed';
create unique index if not exists ai_analysis_runs_processing_dedup_idx on public.ai_analysis_runs (analysis_result_id, input_hash, model, prompt_version, schema_version) where status = 'processing';
drop trigger if exists set_ai_analysis_runs_updated_at on public.ai_analysis_runs;
create trigger set_ai_analysis_runs_updated_at before update on public.ai_analysis_runs for each row execute function public.set_updated_at();

alter table public.ai_analysis_runs enable row level security;
revoke all on public.ai_analysis_runs from public, anon, authenticated;
grant select on public.ai_analysis_runs to authenticated;
drop policy if exists ai_analysis_runs_admin_select on public.ai_analysis_runs;
create policy ai_analysis_runs_admin_select on public.ai_analysis_runs for select to authenticated using (public.has_admin_role(array['super_admin','admin','support']));

alter table public.app_settings drop constraint if exists app_settings_category_check;
alter table public.app_settings add constraint app_settings_category_check
  check (category in ('general','analysis','signup','privacy','maintenance','analytics','content','limits','scrapecreators','ai'));

insert into public.app_settings (key,value,value_type,category,label,description,is_public,validation_schema) values
  ('ai.enabled','false','boolean','ai','Interpretação por IA','Controle mestre da integração; começa desligado.',false,'{}'),
  ('ai.profile_summary_enabled','true','boolean','ai','Resumo do perfil','Permite o resumo assistivo quando a integração estiver ativa.',false,'{}'),
  ('ai.bio_analysis_enabled','true','boolean','ai','Análise da bio','Permite interpretação da bio pública sanitizada.',false,'{}'),
  ('ai.recommendations_enabled','true','boolean','ai','Recomendações','Permite oportunidades fundamentadas.',false,'{}'),
  ('ai.content_ideas_enabled','true','boolean','ai','Ideias de conteúdo','Permite ideias iniciais limitadas.',false,'{}'),
  ('ai.action_plan_explanation_enabled','true','boolean','ai','Explicação do plano','Explica sem alterar o plano determinístico.',false,'{}'),
  ('ai.maximum_recommendations','5','number','ai','Máximo de recomendações','Limite de 1 a 5.',false,'{"min":1,"max":5}'),
  ('ai.maximum_content_ideas','5','number','ai','Máximo de ideias','Limite de 1 a 5.',false,'{"min":1,"max":5}'),
  ('ai.minimum_analysis_confidence','"medium"','string','ai','Confiança mínima','Aceita low, medium ou high.',false,'{"enum":["low","medium","high"]}'),
  ('ai.cache_hours','24','number','ai','Cache em horas','Validade entre 1 e 720 horas.',false,'{"min":1,"max":720}'),
  ('ai.daily_request_limit','100','number','ai','Limite diário de execuções','Teto global de proteção de consumo.',false,'{"min":1,"max":10000}'),
  ('ai.retry_enabled','true','boolean','ai','Retry controlado','Permite uma nova tentativa somente para falhas transitórias.',false,'{}'),
  ('ai.public_visibility','"hidden"','string','ai','Visibilidade pública','hidden, preview ou full; começa oculta.',false,'{"enum":["hidden","preview","full"]}'),
  ('ai.require_registration','false','boolean','ai','Exigir cadastro','Não é usado para esconder todo o valor inicial.',false,'{}'),
  ('ai.engagement_interpretation_audited','true','boolean','ai','Engajamento liberado para IA','Liberado somente para engagement-v2 após auditoria formal documentada.',false,'{}'),
  ('ai.input_snapshot_retention_days','7','number','ai','Retenção da entrada','Prazo conservador do pacote sanitizado.',false,'{"min":1,"max":90}'),
  ('ai.output_retention_days','90','number','ai','Retenção da saída','Prazo dos resultados estruturados.',false,'{"min":7,"max":730}'),
  ('ai.error_retention_days','30','number','ai','Retenção de erros','Prazo dos erros sanitizados.',false,'{"min":7,"max":180}')
on conflict (key) do nothing;

insert into public.feature_flags (key,name,description,enabled,scope) values
  ('ai_profile_analysis','Análise de perfil por IA','Controle mestre da chamada ao provedor.',false,'public'),
  ('ai_profile_summary','Resumo de perfil por IA','Gera resumo estruturado.',false,'public'),
  ('ai_bio_analysis','Análise de bio por IA','Analisa somente bio sanitizada.',false,'public'),
  ('ai_recommendations','Recomendações por IA','Gera oportunidades fundamentadas.',false,'public'),
  ('ai_content_ideas','Ideias de conteúdo por IA','Gera ideias iniciais limitadas.',false,'public'),
  ('ai_action_plan_explanation','Explicação do plano por IA','Explica ações determinísticas sem alterá-las.',false,'public')
on conflict (key) do nothing;

comment on table public.ai_analysis_runs is 'Execuções isoladas e auditáveis da interpretação assistiva; sem resposta bruta nem segredo do provedor.';
comment on column public.ai_analysis_runs.input_snapshot is 'Pacote minimizado e sanitizado, nunca resposta bruta da fonte social.';
commit;
