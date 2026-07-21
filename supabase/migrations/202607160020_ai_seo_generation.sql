begin;

create table if not exists public.page_seo_ai_briefs (
  page_key text primary key references public.page_seo_settings(page_key) on delete cascade,
  additional_guidance text not null default '' check (char_length(additional_guidance) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

drop trigger if exists set_page_seo_ai_briefs_updated_at on public.page_seo_ai_briefs;
create trigger set_page_seo_ai_briefs_updated_at before update on public.page_seo_ai_briefs
for each row execute function public.set_updated_at();

alter table public.page_seo_ai_briefs enable row level security;
revoke all on public.page_seo_ai_briefs from public, anon, authenticated;
grant select, insert, update on public.page_seo_ai_briefs to authenticated;
drop policy if exists page_seo_ai_briefs_select on public.page_seo_ai_briefs;
create policy page_seo_ai_briefs_select on public.page_seo_ai_briefs for select to authenticated using (public.is_admin());
drop policy if exists page_seo_ai_briefs_insert on public.page_seo_ai_briefs;
create policy page_seo_ai_briefs_insert on public.page_seo_ai_briefs for insert to authenticated
with check (public.has_admin_role(array['super_admin','admin','editor']));
drop policy if exists page_seo_ai_briefs_update on public.page_seo_ai_briefs;
create policy page_seo_ai_briefs_update on public.page_seo_ai_briefs for update to authenticated
using (public.has_admin_role(array['super_admin','admin','editor']))
with check (public.has_admin_role(array['super_admin','admin','editor']));

insert into public.page_seo_ai_briefs (page_key)
select page_key from public.page_seo_settings
on conflict (page_key) do nothing;

create table if not exists public.ai_seo_generation_runs (
  id uuid primary key default gen_random_uuid(),
  page_key text not null references public.page_seo_settings(page_key) on delete cascade,
  provider text not null check (provider = 'openai'),
  model text not null check (char_length(model) between 1 and 100),
  prompt_version text not null check (char_length(prompt_version) between 1 and 60),
  schema_version text not null check (char_length(schema_version) between 1 and 60),
  input_hash text not null check (input_hash ~ '^[a-f0-9]{64}$'),
  input_snapshot jsonb check (input_snapshot is null or (jsonb_typeof(input_snapshot) = 'object' and pg_column_size(input_snapshot) <= 32768)),
  output_snapshot jsonb check (output_snapshot is null or (jsonb_typeof(output_snapshot) = 'object' and pg_column_size(output_snapshot) <= 32768)),
  status text not null check (status in ('processing','completed','retryable_failed','failed')),
  requested_by uuid references auth.users(id) on delete set null,
  provider_response_id text check (provider_response_id is null or char_length(provider_response_id) <= 120),
  input_tokens integer not null default 0 check (input_tokens >= 0),
  output_tokens integer not null default 0 check (output_tokens >= 0),
  total_tokens integer not null default 0 check (total_tokens >= 0),
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  retry_count integer not null default 0 check (retry_count between 0 and 1),
  error_code text check (error_code is null or char_length(error_code) <= 80),
  error_message text check (error_message is null or char_length(error_message) <= 300),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ai_seo_generation_runs_page_idx on public.ai_seo_generation_runs (page_key, created_at desc);
create index if not exists ai_seo_generation_runs_status_idx on public.ai_seo_generation_runs (status, created_at desc);
create index if not exists ai_seo_generation_runs_cache_idx on public.ai_seo_generation_runs (page_key, input_hash, model, prompt_version, schema_version, created_at desc) where status = 'completed';
create unique index if not exists ai_seo_generation_runs_processing_dedup_idx on public.ai_seo_generation_runs (page_key, input_hash, model, prompt_version, schema_version) where status = 'processing';
drop trigger if exists set_ai_seo_generation_runs_updated_at on public.ai_seo_generation_runs;
create trigger set_ai_seo_generation_runs_updated_at before update on public.ai_seo_generation_runs
for each row execute function public.set_updated_at();

alter table public.ai_seo_generation_runs enable row level security;
revoke all on public.ai_seo_generation_runs from public, anon, authenticated;
grant select on public.ai_seo_generation_runs to authenticated;
drop policy if exists ai_seo_generation_runs_admin_select on public.ai_seo_generation_runs;
create policy ai_seo_generation_runs_admin_select on public.ai_seo_generation_runs for select to authenticated
using (public.has_admin_role(array['super_admin','admin']));

insert into public.app_settings (key,value,value_type,category,label,description,is_public,validation_schema) values
  ('ai.seo_generation_enabled','true','boolean','ai','Geração de SEO por IA','Permite gerar rascunhos de metadata no painel administrativo.',false,'{}'),
  ('ai.seo_daily_request_limit','50','number','ai','Limite diário de SEO por IA','Teto global diário para proteger o consumo da integração.',false,'{"min":1,"max":1000}'),
  ('ai.seo_cache_hours','24','number','ai','Cache da geração SEO','Prazo para reutilizar uma sugestão idêntica.',false,'{"min":1,"max":720}'),
  ('ai.seo_brand_voice','"Profissional, claro, confiável, direto e acessível; sem exageros comerciais."','string','ai','Voz global para SEO','Diretriz geral aplicada a todas as páginas.',false,'{"maxLength":1000}'),
  ('ai.seo_required_terms','""','string','ai','Termos preferenciais de SEO','Lista separada por vírgulas; usada somente quando os termos forem naturais.',false,'{"maxLength":1000}'),
  ('ai.seo_forbidden_terms','"garantido, milagre, resultado certo"','string','ai','Termos proibidos no SEO','Lista separada por vírgulas que a IA não deve usar.',false,'{"maxLength":1000}')
on conflict (key) do nothing;

comment on table public.page_seo_ai_briefs is 'Orientação editorial complementar e limitada para geração de SEO por página.';
comment on table public.ai_seo_generation_runs is 'Execuções auditáveis de rascunhos SEO; sem resposta bruta nem segredos do provedor.';

commit;
