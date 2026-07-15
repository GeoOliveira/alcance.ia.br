begin;

create table if not exists public.product_features (
  key text primary key check (key ~ '^[a-z][a-z0-9_]*$'),
  name text not null check (char_length(name) between 3 and 120),
  description text not null default '' check (char_length(description) <= 500),
  feature_group text not null check (feature_group in ('profile','category','trending','audio')),
  audience text not null check (audience in ('public','free','premium','admin')),
  status text not null default 'disabled' check (status in ('development','beta','active','disabled')),
  visibility text not null default 'hidden' check (visibility in ('hidden','preview','full')),
  enabled boolean not null default false,
  requires_provider_call boolean not null default false,
  provider text not null default 'internal' check (provider in ('internal','scrapecreators')),
  estimated_credit_cost numeric(10,2) not null default 0 check (estimated_credit_cost >= 0),
  dependencies text[] not null default '{}',
  limits jsonb not null default '{}'::jsonb check (jsonb_typeof(limits) = 'object' and pg_column_size(limits) <= 4096),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object' and pg_column_size(metadata) <= 8192),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.content_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(name) between 2 and 80),
  description text not null default '' check (char_length(description) <= 500),
  keywords text[] not null default '{}',
  seed_hashtags text[] not null default '{}',
  excluded_terms text[] not null default '{}',
  language text not null default 'pt-BR' check (language ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  country text not null default 'BR' check (country ~ '^[A-Z]{2}$'),
  enabled boolean not null default false,
  visible boolean not null default false,
  refresh_minutes integer not null default 1440 check (refresh_minutes between 60 and 10080),
  position integer not null default 0 check (position between 0 and 10000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.feature_interest (
  id uuid primary key default gen_random_uuid(),
  feature_key text not null references public.product_features(key) on delete restrict,
  anonymous_session_id uuid,
  user_id uuid references auth.users(id) on delete set null,
  request_id uuid references public.analysis_requests(id) on delete set null,
  source text not null default 'feature_preview' check (source in ('feature_preview','resources_page','analysis_result','discovery_page')),
  created_at timestamptz not null default now(),
  check (anonymous_session_id is not null or user_id is not null)
);

create table if not exists public.category_discovery_runs (
  id uuid primary key default gen_random_uuid(),
  feature_key text not null references public.product_features(key) on delete restrict,
  category_id uuid references public.content_categories(id) on delete set null,
  endpoint text not null check (char_length(endpoint) between 2 and 80),
  query_snapshot jsonb not null default '{}'::jsonb check (jsonb_typeof(query_snapshot) = 'object' and pg_column_size(query_snapshot) <= 16384),
  period text check (period is null or char_length(period) <= 40),
  status text not null check (status in ('processing','completed','partial','failed','skipped_limit','cache_hit')),
  items_count integer not null default 0 check (items_count between 0 and 500),
  provider_calls integer not null default 0 check (provider_calls >= 0),
  estimated_credit_cost numeric(10,2) not null default 0 check (estimated_credit_cost >= 0),
  cache_hit boolean not null default false,
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  error_code text check (error_code is null or char_length(error_code) <= 80),
  created_at timestamptz not null default now(),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  expires_at timestamptz,
  created_by uuid references auth.users(id) on delete set null
);

create table if not exists public.category_discovery_results (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.content_categories(id) on delete cascade,
  result_type text not null check (result_type in ('hashtags','reels','audio')),
  ranking text not null default 'relevance' check (ranking in ('relevance','views','engagement','relative_performance')),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object' and pg_column_size(snapshot) <= 262144),
  item_count integer not null default 0 check (item_count between 0 and 500),
  provider text,
  provider_calls integer not null default 0 check (provider_calls >= 0),
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.trending_discovery_results (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.content_categories(id) on delete set null,
  result_type text not null check (result_type in ('reels','categories','audio')),
  snapshot jsonb not null check (jsonb_typeof(snapshot) = 'object' and pg_column_size(snapshot) <= 262144),
  item_count integer not null default 0 check (item_count between 0 and 500),
  provider text,
  provider_calls integer not null default 0 check (provider_calls >= 0),
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists product_features_group_enabled_idx on public.product_features (feature_group, enabled, status);
create index if not exists content_categories_enabled_position_idx on public.content_categories (enabled, position, name);
create index if not exists feature_interest_feature_created_idx on public.feature_interest (feature_key, created_at desc);
create index if not exists category_discovery_runs_feature_created_idx on public.category_discovery_runs (feature_key, created_at desc);
create index if not exists category_discovery_runs_category_created_idx on public.category_discovery_runs (category_id, created_at desc);
create unique index if not exists feature_interest_anonymous_unique_idx on public.feature_interest (feature_key, anonymous_session_id) where anonymous_session_id is not null;
create unique index if not exists feature_interest_user_unique_idx on public.feature_interest (feature_key, user_id) where user_id is not null;
create index if not exists category_discovery_lookup_idx on public.category_discovery_results (category_id, result_type, ranking, expires_at desc);
create index if not exists trending_discovery_lookup_idx on public.trending_discovery_results (result_type, expires_at desc);

drop trigger if exists set_product_features_updated_at on public.product_features;
create trigger set_product_features_updated_at before update on public.product_features for each row execute function public.set_updated_at();
drop trigger if exists set_content_categories_updated_at on public.content_categories;
create trigger set_content_categories_updated_at before update on public.content_categories for each row execute function public.set_updated_at();

alter table public.product_features enable row level security;
alter table public.content_categories enable row level security;
alter table public.feature_interest enable row level security;
alter table public.category_discovery_runs enable row level security;
alter table public.category_discovery_results enable row level security;
alter table public.trending_discovery_results enable row level security;

revoke all on public.product_features, public.content_categories, public.feature_interest, public.category_discovery_runs, public.category_discovery_results, public.trending_discovery_results from public, anon, authenticated;
grant select on public.product_features, public.content_categories to anon, authenticated;
grant select on public.category_discovery_results, public.trending_discovery_results to authenticated;
grant insert on public.feature_interest to authenticated;
grant select, insert, update, delete on public.product_features, public.content_categories to authenticated;
grant select on public.feature_interest to authenticated;
grant select on public.category_discovery_runs to authenticated;

drop policy if exists product_features_public_select on public.product_features;
create policy product_features_public_select on public.product_features for select to anon, authenticated
using (enabled and visibility <> 'hidden');
drop policy if exists product_features_admin_select on public.product_features;
create policy product_features_admin_select on public.product_features for select to authenticated using (public.is_admin());
drop policy if exists product_features_admin_insert on public.product_features;
create policy product_features_admin_insert on public.product_features for insert to authenticated with check (public.has_admin_role(array['super_admin']));
drop policy if exists product_features_admin_update on public.product_features;
create policy product_features_admin_update on public.product_features for update to authenticated using (public.has_admin_role(array['super_admin'])) with check (public.has_admin_role(array['super_admin']));
drop policy if exists product_features_admin_delete on public.product_features;
create policy product_features_admin_delete on public.product_features for delete to authenticated using (public.has_admin_role(array['super_admin']));

drop policy if exists content_categories_public_select on public.content_categories;
create policy content_categories_public_select on public.content_categories for select to anon, authenticated using (enabled);
drop policy if exists content_categories_admin_select on public.content_categories;
create policy content_categories_admin_select on public.content_categories for select to authenticated using (public.is_admin());
drop policy if exists content_categories_admin_insert on public.content_categories;
create policy content_categories_admin_insert on public.content_categories for insert to authenticated with check (public.has_admin_role(array['super_admin']));
drop policy if exists content_categories_admin_update on public.content_categories;
create policy content_categories_admin_update on public.content_categories for update to authenticated using (public.has_admin_role(array['super_admin'])) with check (public.has_admin_role(array['super_admin']));
drop policy if exists content_categories_admin_delete on public.content_categories;
create policy content_categories_admin_delete on public.content_categories for delete to authenticated using (public.has_admin_role(array['super_admin']));

drop policy if exists feature_interest_admin_select on public.feature_interest;
create policy feature_interest_admin_select on public.feature_interest for select to authenticated using (public.has_admin_role(array['super_admin','admin']));
drop policy if exists category_discovery_runs_admin_select on public.category_discovery_runs;
create policy category_discovery_runs_admin_select on public.category_discovery_runs for select to authenticated using (public.has_admin_role(array['super_admin','admin']));
drop policy if exists feature_interest_user_insert on public.feature_interest;
create policy feature_interest_user_insert on public.feature_interest for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists category_discovery_admin_select on public.category_discovery_results;
create policy category_discovery_admin_select on public.category_discovery_results for select to authenticated using (public.is_admin());
drop policy if exists trending_discovery_admin_select on public.trending_discovery_results;
create policy trending_discovery_admin_select on public.trending_discovery_results for select to authenticated using (public.is_admin());

insert into public.product_features (key,name,description,feature_group,audience,status,visibility,enabled,requires_provider_call,provider,estimated_credit_cost,limits) values
  ('profile_hashtag_analysis','Análise de hashtags do perfil','Métricas descritivas a partir das legendas armazenadas.','profile','public','active','full',true,false,'internal',0,'{"maxItems":5}'),
  ('profile_top_hashtags','Hashtags mais usadas','Ranking de frequência e desempenho descritivo das hashtags observadas.','profile','public','active','full',true,false,'internal',0,'{"maxItems":8,"minimumPostsPerHashtag":2}'),
  ('profile_top_reels','Reels em destaque','Área de rankings independentes de Reels.','profile','public','active','full',true,false,'internal',0,'{"maxItems":5}'),
  ('profile_reels_by_views','Reels por visualizações','Ranking por plays ou visualizações disponíveis.','profile','public','active','full',true,false,'internal',0,'{"maxItems":5}'),
  ('profile_reels_by_engagement','Reels por engajamento','Ranking por interações divididas por visualizações.','profile','public','active','full',true,false,'internal',0,'{"maxItems":5}'),
  ('profile_reels_relative_performance','Reels por desempenho proporcional','Ranking por visualizações divididas pelos seguidores atuais.','profile','public','active','full',true,false,'internal',0,'{"maxItems":5}'),
  ('profile_audio_analysis','Resumo de áudios','Resumo somente quando o áudio já existe nos dados.','audio','public','beta','hidden',false,false,'internal',0,'{"maxItems":5}'),
  ('category_hashtag_discovery','Hashtags por categoria','Descoberta em snapshots de categorias aprovadas.','category','premium','beta','preview',false,true,'scrapecreators',1,'{"dailyRequests":10,"maxItems":20,"cacheMinutes":360}'),
  ('category_reels_discovery','Reels por categoria','Descoberta em snapshots de categorias aprovadas.','category','premium','beta','preview',false,true,'scrapecreators',1,'{"dailyRequests":10,"maxItems":20,"cacheMinutes":360}'),
  ('category_reels_by_views','Reels da categoria por views','Ranking por views dentro de uma categoria.','category','premium','beta','preview',false,true,'scrapecreators',1,'{"maxItems":20}'),
  ('category_reels_by_engagement','Reels da categoria por engajamento','Ranking por engajamento dentro de uma categoria.','category','premium','beta','preview',false,true,'scrapecreators',1,'{"maxItems":20}'),
  ('category_reels_relative_performance','Reels da categoria por desempenho proporcional','Ranking proporcional dentro de uma categoria.','category','premium','beta','preview',false,true,'scrapecreators',1,'{"maxItems":20}'),
  ('trending_reels','Reels em alta','Snapshots controlados de conteúdos em tendência.','trending','premium','beta','preview',false,true,'scrapecreators',1,'{"dailyRequests":5,"maxItems":20,"cacheMinutes":360}'),
  ('trending_reels_categorization','Categorias de Reels em alta','Classificação controlada de snapshots em tendência.','trending','premium','development','preview',false,false,'internal',0,'{"maxItems":20}'),
  ('reels_audio_discovery','Descoberta de áudios','Áudios observados nos snapshots de Reels.','audio','premium','beta','preview',false,true,'scrapecreators',1,'{"maxItems":20}')
on conflict (key) do nothing;

insert into public.content_categories (slug,name,description,keywords,enabled,position) values
  ('beleza','Beleza','Conteúdos de beleza, maquiagem e cuidados pessoais.',array['beleza','maquiagem','skincare'],false,10),
  ('educacao','Educação','Conteúdos educacionais, aulas e aprendizagem.',array['educação','estudos','aprendizagem'],false,20),
  ('gastronomia','Gastronomia','Receitas, restaurantes e experiências gastronômicas.',array['gastronomia','receitas','comida'],false,30),
  ('marketing','Marketing','Marketing, negócios digitais e criação de conteúdo.',array['marketing','negócios','conteúdo'],false,40),
  ('moda','Moda','Moda, estilo e tendências de vestuário.',array['moda','estilo','look'],false,50),
  ('saude-e-bem-estar','Saúde e bem-estar','Bem-estar, hábitos e atividade física.',array['bem-estar','saúde','fitness'],false,60),
  ('tecnologia','Tecnologia','Tecnologia, produtos digitais e inovação.',array['tecnologia','software','inovação'],false,70),
  ('viagens','Viagens','Destinos, roteiros e experiências de viagem.',array['viagens','turismo','roteiro'],false,80)
on conflict (slug) do nothing;

alter table public.app_settings drop constraint if exists app_settings_category_check;
alter table public.app_settings add constraint app_settings_category_check
  check (category in ('general','analysis','signup','privacy','maintenance','analytics','content','limits','scrapecreators','ai','product'));

insert into public.app_settings (key,value,value_type,category,label,description,is_public,validation_schema) values
  ('product.discovery_daily_limit','10','number','product','Limite diário de descoberta','Teto global de execuções sem cache para recursos de descoberta.',false,'{"min":0,"max":10000}'),
  ('product.discovery_cache_minutes','360','number','product','Cache de descoberta','Validade padrão dos snapshots de descoberta.',false,'{"min":30,"max":10080}'),
  ('product.interest_capture_enabled','true','boolean','product','Captação de interesse','Permite registrar interesse em previews sem dados pessoais.',false,'{}')
on conflict (key) do nothing;

comment on table public.product_features is 'Catálogo operacional fechado de recursos do produto; não armazena segredos.';
comment on table public.feature_interest is 'Sinal mínimo e deduplicado de interesse em recursos indisponíveis ou premium.';
comment on table public.category_discovery_results is 'Snapshots persistidos; a leitura pública nunca dispara coleta externa.';
comment on table public.trending_discovery_results is 'Snapshots persistidos de tendências; a leitura pública nunca dispara coleta externa.';

commit;
