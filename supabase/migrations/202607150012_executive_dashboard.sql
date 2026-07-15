begin;

create table if not exists public.dashboard_modules (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z][a-z0-9_]*$'),
  title text not null check (char_length(title) between 3 and 120),
  description text not null default '' check (char_length(description) <= 500),
  icon text not null default 'chart' check (char_length(icon) between 2 and 40),
  chart_type text not null check (chart_type in ('radar','line','pie','bar','horizontal_bar','comparison')),
  enabled boolean not null default false,
  visible boolean not null default false,
  access_level text not null default 'public' check (access_level in ('public','free','premium','admin')),
  status text not null default 'development' check (status in ('development','beta','active','disabled')),
  display_order integer not null default 100 check (display_order between 0 and 10000),
  requires_ai boolean not null default false,
  requires_authentication boolean not null default false,
  requires_premium boolean not null default false,
  configuration jsonb not null default '{}'::jsonb check (jsonb_typeof(configuration) = 'object' and pg_column_size(configuration) <= 8192),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create index if not exists dashboard_modules_order_idx on public.dashboard_modules (enabled, visible, display_order);
drop trigger if exists set_dashboard_modules_updated_at on public.dashboard_modules;
create trigger set_dashboard_modules_updated_at before update on public.dashboard_modules for each row execute function public.set_updated_at();

alter table public.dashboard_modules enable row level security;
revoke all on public.dashboard_modules from public, anon, authenticated;
grant select, update on public.dashboard_modules to authenticated;
drop policy if exists dashboard_modules_admin_select on public.dashboard_modules;
create policy dashboard_modules_admin_select on public.dashboard_modules for select to authenticated using (public.is_admin());
drop policy if exists dashboard_modules_super_admin_update on public.dashboard_modules;
create policy dashboard_modules_super_admin_update on public.dashboard_modules for update to authenticated using (public.has_admin_role(array['super_admin'])) with check (public.has_admin_role(array['super_admin']));

insert into public.dashboard_modules (key,title,description,icon,chart_type,enabled,visible,access_level,status,display_order,configuration) values
  ('profile_health_radar','Saúde do perfil','Visão equilibrada dos principais fundamentos do perfil.','radar','radar',true,true,'public','active',10,'{"minimumData":3}'),
  ('recent_posts_performance','Desempenho das publicações recentes','Evolução do engajamento estimado nas últimas publicações.','trend','line',true,true,'public','active',20,'{"minimumData":2}'),
  ('content_format_distribution','Distribuição de formatos','Participação de Reels, carrosséis e fotos no conteúdo analisado.','pie','pie',true,true,'public','active',30,'{"minimumData":1}'),
  ('top_reels_views','Reels com mais visualizações','Destaques por plays ou visualizações disponíveis.','play','bar',true,true,'public','active',40,'{"minimumData":1}'),
  ('top_hashtags','Hashtags mais usadas','Frequência das hashtags observadas nas publicações.','hashtag','horizontal_bar',true,true,'public','active',50,'{"minimumData":1}'),
  ('format_comparison','Comparativo por formato','Médias observadas de curtidas, comentários e visualizações.','compare','comparison',true,true,'public','active',60,'{"minimumData":1}')
on conflict (key) do nothing;

insert into public.feature_flags (key,name,description,enabled,scope) values
  ('dashboard_enabled','Dashboard Executivo','Habilita o Dashboard Executivo na análise pública.',true,'public'),
  ('dashboard_radar','Radar do perfil','Habilita o radar de saúde do perfil.',true,'public'),
  ('dashboard_posts_chart','Gráfico de publicações','Habilita o gráfico de publicações recentes.',true,'public'),
  ('dashboard_formats_chart','Gráfico de formatos','Habilita a distribuição de formatos.',true,'public'),
  ('dashboard_top_reels_chart','Gráfico de Reels','Habilita o ranking visual de Reels.',true,'public'),
  ('dashboard_hashtags_chart','Gráfico de hashtags','Habilita o ranking visual de hashtags.',true,'public'),
  ('dashboard_comparison_chart','Comparativo de formatos','Habilita o comparativo entre formatos.',true,'public'),
  ('dashboard_premium_preview','Preview premium','Exibe preview dos módulos premium bloqueados.',true,'public')
on conflict (key) do nothing;

comment on table public.dashboard_modules is 'Catálogo e controle operacional dos módulos visuais do Dashboard Executivo.';
commit;
