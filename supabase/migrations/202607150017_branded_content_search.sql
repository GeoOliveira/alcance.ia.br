begin;

alter table public.product_features drop constraint if exists product_features_feature_group_check;
alter table public.product_features add constraint product_features_feature_group_check check (feature_group in ('profile','category','trending','audio','research'));
alter table public.product_features drop constraint if exists product_features_provider_check;
-- `apify` may already exist in environments where provider preparation preceded this migration.
alter table public.product_features add constraint product_features_provider_check check (provider in ('internal','scrapecreators','meta','apify')) not valid;
alter table public.product_features drop constraint if exists product_features_status_check;
alter table public.product_features add constraint product_features_status_check check (status in ('development','beta','active','disabled','maintenance'));

insert into public.product_features (key,name,description,feature_group,audience,status,visibility,enabled,requires_provider_call,provider,estimated_credit_cost,limits,metadata) values
  ('branded_content_search','Pesquisa de Conteúdo de Marca','Pesquisa conteúdos de marca declarados usando exclusivamente a Graph API oficial da Meta.','research','admin','development','hidden',false,true,'meta',1,
   '{"dailyRequests":100,"anonymousDailyRequests":3,"freeDailyRequests":10,"premiumDailyRequests":50,"adminDailyRequests":100,"maxItems":100,"cacheMinutes":15}',
   '{"requiresAuthentication":true,"requiresPremium":false,"paginationEnabled":false,"aiSummaryEnabled":false,"exportEnabled":false,"historyEnabled":false,"indexable":false,"beta":false,"unavailableMessage":"Este recurso está em validação técnica e ainda não está disponível."}')
on conflict (key) do nothing;

insert into public.feature_flags (key,name,description,enabled,scope) values
  ('resource_branded_content','Pesquisa de conteúdo de marca','Autoriza acesso, processamento e chamadas externas do recurso.',false,'public'),
  ('resource_branded_content_pagination','Paginação de conteúdo de marca','Autoriza o uso de cursores e páginas adicionais.',false,'public'),
  ('resource_branded_content_dashboard','Dashboard de conteúdo de marca','Autoriza resumos e gráficos baseados nos resultados carregados.',false,'public'),
  ('resource_branded_content_ai','IA de conteúdo de marca','Reserva a execução futura de resumo por IA.',false,'public'),
  ('resource_branded_content_history','Histórico de conteúdo de marca','Reserva a persistência futura do histórico do usuário.',false,'public'),
  ('resource_branded_content_export','Exportação de conteúdo de marca','Reserva a exportação futura dos resultados carregados.',false,'public'),
  ('resource_branded_content_premium_preview','Preview premium de conteúdo de marca','Autoriza a prévia controlada quando o acesso for Premium.',false,'public')
on conflict (key) do nothing;

insert into public.dashboard_modules (key,title,description,icon,chart_type,enabled,visible,access_level,status,display_order,requires_ai,requires_authentication,requires_premium,configuration) values
  ('branded_content_chart_types','Distribuição por tipo','Distribuição dos formatos nos resultados carregados.','pie','pie',false,false,'admin','development',210,false,true,false,'{"minimumData":1,"source":"branded_content_search"}'),
  ('branded_content_chart_timeline','Conteúdos por período','Linha temporal dos resultados carregados.','trend','line',false,false,'admin','development',220,false,true,false,'{"minimumData":2,"source":"branded_content_search"}'),
  ('branded_content_chart_partners','Parceiros recorrentes','Parceiros mais frequentes nos resultados carregados.','partners','horizontal_bar',false,false,'admin','development',230,false,true,false,'{"minimumData":1,"source":"branded_content_search"}'),
  ('branded_content_chart_creators','Criadores recorrentes','Criadores mais frequentes nos resultados carregados.','creators','horizontal_bar',false,false,'admin','development',240,false,true,false,'{"minimumData":1,"source":"branded_content_search"}')
on conflict (key) do nothing;

create table if not exists public.branded_content_search_runs (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), user_id uuid references auth.users(id) on delete set null,
  anonymous_identifier text check (anonymous_identifier is null or char_length(anonymous_identifier) <= 128), platform text not null check (platform in ('instagram','facebook')),
  query_hash text not null check (query_hash ~ '^[a-f0-9]{64}$'), query_display text not null check (char_length(query_display) <= 300), date_min date not null, date_max date not null,
  status text not null check (status in ('completed','empty','failed','cache_hit','rate_limited')), results_count integer not null default 0 check (results_count between 0 and 500),
  pages_loaded integer not null default 1 check (pages_loaded between 1 and 100), from_cache boolean not null default false, duration_ms integer check (duration_ms is null or duration_ms >= 0),
  error_code text check (error_code is null or char_length(error_code) <= 80), expires_at timestamptz not null, check (user_id is not null or anonymous_identifier is not null)
);
create index if not exists branded_content_runs_created_idx on public.branded_content_search_runs (created_at desc);
create index if not exists branded_content_runs_user_created_idx on public.branded_content_search_runs (user_id, created_at desc) where user_id is not null;
create index if not exists branded_content_runs_anonymous_created_idx on public.branded_content_search_runs (anonymous_identifier, created_at desc) where anonymous_identifier is not null;
create index if not exists branded_content_runs_expires_idx on public.branded_content_search_runs (expires_at);
alter table public.branded_content_search_runs enable row level security;
revoke all on public.branded_content_search_runs from public, anon, authenticated;
grant select on public.branded_content_search_runs to authenticated;
drop policy if exists branded_content_runs_admin_select on public.branded_content_search_runs;
create policy branded_content_runs_admin_select on public.branded_content_search_runs for select to authenticated using (public.has_admin_role(array['super_admin','admin']));

alter table public.feature_interest drop constraint if exists feature_interest_source_check;
alter table public.feature_interest add constraint feature_interest_source_check check (source in ('feature_preview','resources_page','analysis_result','discovery_page','branded_content_page'));

comment on table public.branded_content_search_runs is 'Telemetria operacional mínima e temporária; não armazena token, resposta da Meta nem URL de paginação.';
commit;
