begin;

alter table public.product_features drop constraint if exists product_features_provider_check;
alter table public.product_features add constraint product_features_provider_check check (provider in ('internal','scrapecreators','meta','multi'));
update public.product_features set provider='multi', description='Pesquisa conteúdos de marca por provedores integrados e resposta normalizada.' where key='branded_content_search';

insert into public.app_settings (key,value,value_type,category,label,description,is_public,validation_schema) values
  ('branded_content.provider_mode','"meta_only"','string','product','Modo do provedor','Fonte operacional da pesquisa.','false','{"enum":["meta_only","apify_only","automatic_fallback","admin_compare"]}'),
  ('branded_content.primary_provider','"meta_official"','string','product','Provedor principal','Provedor usado primeiro.','false','{"enum":["meta_official","apify"]}'),
  ('branded_content.fallback_provider','"apify"','string','product','Provedor de fallback','Provedor alternativo.','false','{"enum":["meta_official","apify"]}'),
  ('branded_content.fallback_enabled','false','boolean','product','Fallback habilitado','Autoriza fallback em falhas elegíveis.','false','{}'),
  ('branded_content.fallback_on_empty','false','boolean','product','Fallback em vazio','Pode gerar custo quando a resposta principal é vazia.','false','{}'),
  ('branded_content.fallback_error_codes','["META_TIMEOUT","META_INVALID_RESPONSE","META_PROVIDER"]','json','product','Erros de fallback','Lista fechada de falhas técnicas elegíveis.','false','{}'),
  ('branded_content.compare_mode_enabled','false','boolean','product','Comparação administrativa','Autoriza consulta dupla apenas no admin.','false','{}'),
  ('branded_content.maximum_results','100','number','product','Máximo de resultados','Teto comum da resposta normalizada.','false','{"min":1,"max":500}'),
  ('branded_content.cache_minutes','15','number','product','Cache padrão','Cache legado do recurso.','false','{"min":1,"max":10080}'),
  ('branded_content.meta_enabled','false','boolean','product','Meta habilitada','Controle administrativo complementar à flag.','false','{}'),
  ('branded_content.apify_enabled','false','boolean','product','Apify habilitada','Controle administrativo complementar à flag.','false','{}'),
  ('branded_content.apify_results_limit','25','number','product','Limite por execução Apify','Nunca executa sem limite.','false','{"min":1,"max":500}'),
  ('branded_content.apify_timeout_seconds','90','number','product','Timeout Apify','Referência operacional; o ambiente define o teto efetivo.','false','{"min":5,"max":300}'),
  ('branded_content.apify_daily_run_limit','10','number','product','Limite diário Apify','Teto conservador de execuções diárias.','false','{"min":0,"max":10000}'),
  ('branded_content.apify_monthly_cost_alert','25','number','product','Alerta mensal Apify (USD)','Limiar informativo de custo estimado.','false','{"min":0,"max":100000}'),
  ('branded_content.meta_cache_minutes','15','number','product','Cache Meta','Cache independente da API oficial.','false','{"min":1,"max":10080}'),
  ('branded_content.apify_cache_minutes','60','number','product','Cache Apify','Cache independente do Actor.','false','{"min":1,"max":10080}'),
  ('branded_content.apify_global_daily_run_limit','10','number','product','Limite global diário Apify','Teto global de runs pagas.','false','{"min":0,"max":10000}'),
  ('branded_content.apify_daily_result_limit','250','number','product','Limite diário de resultados Apify','Teto diário de resultados cobrados.','false','{"min":0,"max":1000000}'),
  ('branded_content.apify_max_results_per_run','25','number','product','Máximo por run Apify','Teto por execução.','false','{"min":1,"max":500}'),
  ('branded_content.apify_allow_public_usage','false','boolean','product','Uso público da Apify','Permissão explícita para consumo público.','false','{}')
on conflict (key) do nothing;

insert into public.feature_flags (key,name,description,enabled,scope) values
  ('provider_meta_branded_content','Provedor Meta de conteúdo de marca','Impede chamadas reais à Meta quando desligada.',false,'internal'),
  ('provider_apify_branded_content','Provedor Apify de conteúdo de marca','Impede chamadas reais à Apify quando desligada.',false,'internal'),
  ('branded_content_provider_fallback','Fallback de conteúdo de marca','Autoriza fallback técnico controlado.',false,'internal'),
  ('branded_content_provider_comparison','Comparação de provedores','Autoriza consultas duplas administrativas.',false,'admin'),
  ('branded_content_provider_health','Saúde dos provedores','Autoriza health checks administrativos baratos.',false,'admin')
on conflict (key) do nothing;

alter table public.branded_content_search_runs add column if not exists provider_mode text not null default 'meta_only' check (provider_mode in ('meta_only','apify_only','automatic_fallback','admin_compare'));
alter table public.branded_content_search_runs add column if not exists provider_used text check (provider_used in ('meta_official','apify'));
alter table public.branded_content_search_runs add column if not exists fallback_used boolean not null default false;
alter table public.branded_content_search_runs add column if not exists primary_provider_status text;
alter table public.branded_content_search_runs add column if not exists fallback_provider_status text;
alter table public.branded_content_search_runs add column if not exists estimated_cost numeric(12,6) not null default 0 check (estimated_cost >= 0);
alter table public.branded_content_search_runs add column if not exists provider_run_id text;
alter table public.branded_content_search_runs add column if not exists provider_dataset_id text;
alter table public.branded_content_search_runs drop constraint if exists branded_content_search_runs_status_check;
alter table public.branded_content_search_runs add constraint branded_content_search_runs_status_check check (status in ('queued','processing','completed','completed_with_warnings','empty','failed','timed_out','cache_hit','rate_limited'));
create index if not exists branded_content_runs_provider_created_idx on public.branded_content_search_runs(provider_used,created_at desc);

create table if not exists public.branded_content_provider_health (
  provider text primary key check (provider in ('meta_official','apify')), checked_at timestamptz not null default now(), available boolean not null,
  code text check (code is null or char_length(code) <= 80), duration_ms integer check (duration_ms is null or duration_ms >= 0), updated_by uuid references auth.users(id) on delete set null
);
alter table public.branded_content_provider_health enable row level security;
revoke all on public.branded_content_provider_health from public, anon, authenticated;
grant select,insert,update on public.branded_content_provider_health to authenticated;
drop policy if exists branded_content_provider_health_admin_select on public.branded_content_provider_health;
create policy branded_content_provider_health_admin_select on public.branded_content_provider_health for select to authenticated using (public.has_admin_role(array['super_admin','admin']));
drop policy if exists branded_content_provider_health_admin_write on public.branded_content_provider_health;
create policy branded_content_provider_health_admin_write on public.branded_content_provider_health for all to authenticated using (public.has_admin_role(array['super_admin','admin'])) with check (public.has_admin_role(array['super_admin','admin']));

comment on column public.branded_content_search_runs.provider_run_id is 'Identificador interno da execução; nunca exposto na API pública.';
comment on column public.branded_content_search_runs.provider_dataset_id is 'Identificador interno do dataset; nunca exposto na API pública.';
commit;
