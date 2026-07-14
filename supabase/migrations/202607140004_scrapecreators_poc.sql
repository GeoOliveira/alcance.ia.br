begin;

create table if not exists public.provider_test_runs (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), created_by uuid not null references auth.users(id),
  provider text not null check (provider = 'scrapecreators'), platform text not null check (platform = 'instagram'),
  endpoint text not null check (endpoint in ('profile','posts','reels','post_details')), input_identifier text not null check (char_length(input_identifier) between 1 and 200),
  status text not null check (status in ('success','failed')), http_status integer, duration_ms integer not null check (duration_ms >= 0),
  estimated_credit_cost integer not null default 0 check (estimated_credit_cost >= 0), items_count integer not null default 0 check (items_count >= 0),
  used_cache boolean not null default false, calls_count integer not null default 0 check (calls_count >= 0), retries_count integer not null default 0 check (retries_count between 0 and 1),
  request_metadata jsonb not null default '{}'::jsonb, normalized_result jsonb, raw_response jsonb, field_inventory jsonb not null default '{}'::jsonb,
  validation_issues jsonb not null default '[]'::jsonb, error_code text, error_message text, raw_expires_at timestamptz, expires_at timestamptz not null
);
create index if not exists provider_test_runs_created_at_idx on public.provider_test_runs (created_at desc);
create index if not exists provider_test_runs_provider_idx on public.provider_test_runs (provider);
create index if not exists provider_test_runs_endpoint_idx on public.provider_test_runs (endpoint);
create index if not exists provider_test_runs_status_idx on public.provider_test_runs (status);
create index if not exists provider_test_runs_input_identifier_idx on public.provider_test_runs (input_identifier);

alter table public.provider_test_runs enable row level security;
revoke all on public.provider_test_runs from anon, authenticated;
grant select, delete on public.provider_test_runs to authenticated;
drop policy if exists provider_test_runs_admin_select on public.provider_test_runs;
create policy provider_test_runs_admin_select on public.provider_test_runs for select to authenticated using (public.has_admin_role(array['super_admin','admin']));
drop policy if exists provider_test_runs_super_admin_delete on public.provider_test_runs;
create policy provider_test_runs_super_admin_delete on public.provider_test_runs for delete to authenticated using (public.has_admin_role(array['super_admin']));

-- Mantém a lista fechada de categorias, acrescentando a categoria exclusiva da POC.
alter table public.app_settings drop constraint if exists app_settings_category_check;
alter table public.app_settings add constraint app_settings_category_check
  check (category in ('general','analysis','signup','privacy','maintenance','analytics','content','limits','scrapecreators'));

insert into public.app_settings (key,value,value_type,category,label,description,is_public,validation_schema) values
 ('scrapecreators.poc_enabled','false','boolean','scrapecreators','POC habilitada','Segundo controle administrativo da prova de conceito.',false,'{}'),
 ('scrapecreators.poc_daily_request_limit','100','number','scrapecreators','Limite diário','Máximo de chamadas sem cache por dia.',false,'{"min":1,"max":10000}'),
 ('scrapecreators.poc_max_pages_per_test','3','number','scrapecreators','Máximo de páginas','Limite de páginas por teste; o padrão da tela é uma.',false,'{"min":1,"max":10}'),
 ('scrapecreators.poc_allow_force_refresh','false','boolean','scrapecreators','Permitir atualização forçada','Permite ignorar cache com aviso de créditos.',false,'{}'),
 ('scrapecreators.poc_raw_retention_days','7','number','scrapecreators','Retenção bruta','Dias antes da resposta bruta expirar.',false,'{"min":1,"max":30}'),
 ('scrapecreators.poc_normalized_retention_days','30','number','scrapecreators','Retenção normalizada','Dias antes da execução normalizada expirar.',false,'{"min":1,"max":365}'),
 ('scrapecreators.profile_cache_minutes','30','number','scrapecreators','Cache de perfil','TTL de perfil em minutos.',false,'{"min":1,"max":1440}'),
 ('scrapecreators.posts_cache_minutes','30','number','scrapecreators','Cache de posts','TTL de posts em minutos.',false,'{"min":1,"max":1440}'),
 ('scrapecreators.reels_cache_minutes','30','number','scrapecreators','Cache de Reels','TTL de Reels em minutos.',false,'{"min":1,"max":1440}'),
 ('scrapecreators.post_details_cache_minutes','60','number','scrapecreators','Cache de detalhes','TTL de detalhes em minutos.',false,'{"min":1,"max":1440}')
on conflict (key) do nothing;
insert into public.feature_flags (key,name,description,enabled,scope) values
 ('scrapecreators_poc','ScrapeCreators POC','Acesso administrativo à prova de conceito. Não ativa o fluxo público.',false,'admin')
on conflict (key) do nothing;

comment on table public.provider_test_runs is 'Execuções administrativas sanitizadas da POC ScrapeCreators; inserções somente pelo servidor com service role.';

commit;
