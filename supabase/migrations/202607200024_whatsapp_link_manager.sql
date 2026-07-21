begin;

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 120),
  avatar_url text null check (avatar_url is null or char_length(avatar_url) <= 1000),
  access_level text not null default 'free' check (access_level in ('free','premium','admin')),
  marketing_consent boolean not null default false,
  preferences jsonb not null default '{}'::jsonb check (jsonb_typeof(preferences) = 'object'),
  last_activity_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.account_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null check (consent_type in ('terms','privacy','marketing')),
  version text not null check (char_length(version) between 1 and 30),
  granted boolean not null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz null,
  created_at timestamptz not null default now()
);

create table if not exists public.user_whatsapp_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  encurta_link_id text not null check (char_length(encurta_link_id) between 1 and 200),
  title text not null check (char_length(title) between 1 and 120),
  phone text not null check (phone ~ '^55[1-9][0-9]{9,10}$'),
  message text not null default '' check (char_length(message) <= 2000),
  slug text not null check (slug ~ '^[A-Za-z0-9]{4,32}$'),
  short_url text not null check (short_url ~ '^https://encurta\.io/[A-Za-z0-9]{4,32}$'),
  official_url text not null check (official_url ~ '^https://wa\.me/55[1-9][0-9]{9,10}'),
  status text not null default 'active' check (status in ('active','inactive','expired')),
  labels text[] not null default '{}'::text[],
  expires_at timestamptz null,
  archived_at timestamptz null,
  deleted_at timestamptz null,
  last_clicked_at timestamptz null,
  click_count bigint not null default 0 check (click_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, slug),
  unique (user_id, encurta_link_id)
);

create table if not exists public.user_link_metric_cache (
  link_id uuid primary key references public.user_whatsapp_links(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  total_clicks bigint not null default 0 check (total_clicks >= 0),
  last_click_at timestamptz null,
  daily jsonb not null default '[]'::jsonb check (jsonb_typeof(daily) = 'array'),
  devices jsonb not null default '[]'::jsonb check (jsonb_typeof(devices) = 'array'),
  referrers jsonb not null default '[]'::jsonb check (jsonb_typeof(referrers) = 'array'),
  human_estimate bigint null check (human_estimate is null or human_estimate >= 0),
  bot_count bigint null check (bot_count is null or bot_count >= 0),
  source_updated_at timestamptz null,
  cached_at timestamptz not null default now()
);

create table if not exists public.user_activity_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in ('link_created','link_updated','link_archived','link_deleted','link_copied','qr_downloaded','metrics_viewed','account_updated')),
  entity_id uuid null,
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  created_at timestamptz not null default now()
);

create index if not exists user_whatsapp_links_user_created_idx on public.user_whatsapp_links (user_id, created_at desc) where deleted_at is null;
create index if not exists user_whatsapp_links_user_status_idx on public.user_whatsapp_links (user_id, status, archived_at) where deleted_at is null;
create index if not exists user_whatsapp_links_user_title_idx on public.user_whatsapp_links (user_id, lower(title)) where deleted_at is null;
create index if not exists account_consents_user_created_idx on public.account_consents (user_id, created_at desc);
create index if not exists user_activity_logs_user_created_idx on public.user_activity_logs (user_id, created_at desc);

drop trigger if exists set_user_profiles_updated_at on public.user_profiles;
create trigger set_user_profiles_updated_at before update on public.user_profiles for each row execute function public.set_updated_at();
drop trigger if exists set_user_whatsapp_links_updated_at on public.user_whatsapp_links;
create trigger set_user_whatsapp_links_updated_at before update on public.user_whatsapp_links for each row execute function public.set_updated_at();

create or replace function public.create_user_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_profiles (user_id, display_name, avatar_url)
  values (new.id, left(coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', ''), 120), left(new.raw_user_meta_data->>'avatar_url', 1000))
  on conflict (user_id) do nothing;
  if coalesce((new.raw_user_meta_data->>'terms_accepted')::boolean, false) then
    insert into public.account_consents (user_id, consent_type, version, granted)
    values (new.id, 'terms', coalesce(new.raw_user_meta_data->>'consent_version', '1'), true),
           (new.id, 'privacy', coalesce(new.raw_user_meta_data->>'consent_version', '1'), true);
  end if;
  if new.raw_user_meta_data ? 'marketing_consent' then
    insert into public.account_consents (user_id, consent_type, version, granted)
    values (new.id, 'marketing', coalesce(new.raw_user_meta_data->>'consent_version', '1'), coalesce((new.raw_user_meta_data->>'marketing_consent')::boolean, false));
  end if;
  return new;
end;
$$;
revoke all on function public.create_user_profile() from public, anon, authenticated;
drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile after insert on auth.users for each row execute function public.create_user_profile();

alter table public.user_profiles enable row level security;
alter table public.account_consents enable row level security;
alter table public.user_whatsapp_links enable row level security;
alter table public.user_link_metric_cache enable row level security;
alter table public.user_activity_logs enable row level security;

revoke all on public.user_profiles, public.account_consents, public.user_whatsapp_links, public.user_link_metric_cache, public.user_activity_logs from anon, authenticated;
grant select, insert, update on public.user_profiles to authenticated;
grant select, insert on public.account_consents to authenticated;
grant select, insert, update on public.user_whatsapp_links to authenticated;
grant select on public.user_link_metric_cache to authenticated;
grant select, insert on public.user_activity_logs to authenticated;

drop policy if exists user_profiles_own_select on public.user_profiles;
create policy user_profiles_own_select on public.user_profiles for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
drop policy if exists user_profiles_own_insert on public.user_profiles;
create policy user_profiles_own_insert on public.user_profiles for insert to authenticated with check (user_id = (select auth.uid()) and access_level = 'free');
drop policy if exists user_profiles_own_update on public.user_profiles;
create policy user_profiles_own_update on public.user_profiles for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists account_consents_own_select on public.account_consents;
create policy account_consents_own_select on public.account_consents for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists account_consents_own_insert on public.account_consents;
create policy account_consents_own_insert on public.account_consents for insert to authenticated with check (user_id = (select auth.uid()));

drop policy if exists whatsapp_links_own_select on public.user_whatsapp_links;
create policy whatsapp_links_own_select on public.user_whatsapp_links for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists whatsapp_links_own_insert on public.user_whatsapp_links;
create policy whatsapp_links_own_insert on public.user_whatsapp_links for insert to authenticated with check (user_id = (select auth.uid()));
drop policy if exists whatsapp_links_own_update on public.user_whatsapp_links;
create policy whatsapp_links_own_update on public.user_whatsapp_links for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

drop policy if exists metric_cache_own_select on public.user_link_metric_cache;
create policy metric_cache_own_select on public.user_link_metric_cache for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists activity_logs_own_select on public.user_activity_logs;
create policy activity_logs_own_select on public.user_activity_logs for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists activity_logs_own_insert on public.user_activity_logs;
create policy activity_logs_own_insert on public.user_activity_logs for insert to authenticated with check (user_id = (select auth.uid()));

alter table public.page_seo_settings drop constraint if exists page_seo_settings_page_key_check;
alter table public.page_seo_settings add constraint page_seo_settings_page_key_check check (page_key in ('home','about','how_it_works','resources','contact','privacy_policy','terms','cookies_policy','data_deletion','hashtags','trending_reels','category_reels','branded_content','whatsapp_link_generator','whatsapp_link_manager'));
alter table public.page_seo_settings drop constraint if exists page_seo_settings_route_check;
alter table public.page_seo_settings add constraint page_seo_settings_route_check check (route in ('/','/quem-somos','/como-funciona','/recursos','/contato','/politica-de-privacidade','/termos-de-uso','/politica-de-cookies','/exclusao-de-dados','/recursos/hashtags','/recursos/reels-em-alta','/recursos/reels-por-categoria','/recursos/conteudo-de-marca','/recursos/gerador-link-whatsapp','/recursos/gerenciador-links-whatsapp'));
insert into public.page_seo_settings (page_key,route,meta_title,meta_description)
values ('whatsapp_link_manager','/recursos/gerenciador-links-whatsapp','Gerenciador de Links WhatsApp com QR Code | Alcance IA','Crie links curtos do WhatsApp, gere QR Codes e acompanhe cliques em um painel simples. Organize e gerencie seus links com a Alcance IA.')
on conflict (page_key) do nothing;

insert into public.product_features (key,name,description,feature_group,audience,status,visibility,enabled,requires_provider_call,provider,estimated_credit_cost,limits,dependencies,metadata) values
('whatsapp_link_manager','Gerenciador de Links WhatsApp','Criação, organização e acompanhamento de links curtos do WhatsApp.','category','free','beta','preview',false,true,'internal',0,'{"dailyRequests":10,"userDailyRequests":10,"maxItems":10,"cacheMinutes":5}'::jsonb,array['encurta_integration'],'{"category":"Ferramentas","accessLevel":"free","requiresAuthentication":true,"requiresPremium":false,"indexable":true}'::jsonb),
('whatsapp_manager_landing','Landing do gerenciador','Apresentação pública do recurso.','category','public','beta','preview',false,false,'internal',0,'{}'::jsonb,array['whatsapp_link_manager'],'{}'::jsonb),
('whatsapp_manager_auth','Autenticação do gerenciador','Cadastro, login e recuperação de conta.','category','free','beta','preview',true,false,'internal',0,'{}'::jsonb,array['whatsapp_link_manager'],'{}'::jsonb),
('whatsapp_manager_google_login','Login com Google','Login Google por OAuth ou ID token.','category','free','beta','hidden',false,false,'internal',0,'{}'::jsonb,array['whatsapp_manager_auth'],'{}'::jsonb),
('whatsapp_manager_google_one_tap','Google One Tap','Acesso por Google One Tap com nonce.','category','free','beta','hidden',false,false,'internal',0,'{}'::jsonb,array['whatsapp_manager_google_login'],'{}'::jsonb),
('whatsapp_manager_create_link','Criar link','Criação autenticada de link curto.','category','free','beta','preview',true,true,'internal',0,'{}'::jsonb,array['whatsapp_link_manager','encurta_integration'],'{}'::jsonb),
('whatsapp_manager_shortener','Encurtador','Integração privada com Encurta.io.','category','free','beta','preview',true,true,'internal',0,'{}'::jsonb,array['encurta_integration'],'{}'::jsonb),
('whatsapp_manager_qr_code','QR Code','QR Code determinístico do link curto.','category','free','beta','preview',true,false,'internal',0,'{}'::jsonb,array['whatsapp_link_manager'],'{}'::jsonb),
('whatsapp_manager_click_metrics','Métricas de cliques','Agregados fornecidos pelo Encurta.io.','category','free','beta','preview',true,true,'internal',0,'{}'::jsonb,array['whatsapp_link_manager'],'{}'::jsonb),
('whatsapp_manager_history','Histórico','Atividade recente do usuário.','category','free','beta','preview',true,false,'internal',0,'{}'::jsonb,array['whatsapp_link_manager'],'{}'::jsonb),
('whatsapp_manager_edit_link','Editar link','Edição conforme capacidades da API.','category','free','development','preview',true,true,'internal',0,'{}'::jsonb,array['whatsapp_link_manager'],'{}'::jsonb),
('whatsapp_manager_expiration','Expiração','Expiração conforme capacidades da API.','category','free','development','preview',true,true,'internal',0,'{}'::jsonb,array['whatsapp_link_manager'],'{}'::jsonb),
('whatsapp_manager_export','Exportação','Exportação futura.','category','premium','development','hidden',false,false,'internal',0,'{}'::jsonb,array['whatsapp_link_manager'],'{}'::jsonb),
('whatsapp_manager_custom_slug','Slug personalizado','Slug personalizado futuro.','category','premium','development','hidden',false,true,'internal',0,'{}'::jsonb,array['whatsapp_link_manager'],'{}'::jsonb),
('whatsapp_manager_advanced_analytics','Analytics avançado','Métricas avançadas futuras.','category','premium','development','hidden',false,true,'internal',0,'{}'::jsonb,array['whatsapp_link_manager'],'{}'::jsonb)
on conflict (key) do nothing;

insert into public.feature_flags (key,name,description,enabled,scope) values
('resource_whatsapp_link_manager','Gerenciador de Links WhatsApp','Disponibilidade principal; começa desativada.',false,'public'),
('whatsapp_manager_registration','Cadastro do gerenciador','Permite cadastro por e-mail.',true,'public'),
('whatsapp_manager_password_login','Login por senha','Permite login por e-mail e senha.',true,'public'),
('whatsapp_manager_google_login','Login Google','Permite autenticação Google.',false,'public'),
('whatsapp_manager_google_one_tap','Google One Tap','Permite Google One Tap.',false,'public'),
('whatsapp_manager_create_link','Criação de link','Permite criar links curtos.',true,'public'),
('whatsapp_manager_qr_code','QR Code','Permite visualizar e baixar QR Codes.',true,'public'),
('whatsapp_manager_click_metrics','Métricas','Permite consultar métricas agregadas.',true,'public'),
('whatsapp_manager_edit_link','Edição','Permite editar quando a API suportar.',true,'public'),
('whatsapp_manager_expiration','Expiração','Permite expiração quando a API suportar.',true,'public'),
('whatsapp_manager_export','Exportação','Exportação futura.',false,'public'),
('whatsapp_manager_custom_slug','Slug personalizado','Slug personalizado futuro.',false,'public'),
('whatsapp_manager_advanced_analytics','Analytics avançado','Analytics avançado futuro.',false,'public')
on conflict (key) do nothing;

insert into public.app_settings (key,value,value_type,category,label,description,is_public,validation_schema) values
('whatsapp_manager.max_links_free','10','number','product','Links no plano gratuito','Máximo de links não excluídos por conta gratuita.',false,'{"min":0,"max":10000}'),
('whatsapp_manager.max_links_premium','500','number','product','Links no plano premium','Máximo de links não excluídos por conta premium.',false,'{"min":0,"max":100000}'),
('whatsapp_manager.metrics_cache_minutes','5','number','product','Cache de métricas','Janela curta para agregados do Encurta.io.',false,'{"min":1,"max":1440}'),
('whatsapp_manager.maintenance_message','"O gerenciador está temporariamente indisponível."','string','product','Mensagem de manutenção','Mensagem pública sem detalhes técnicos.',true,'{"maxLength":240}')
on conflict (key) do nothing;

comment on table public.user_whatsapp_links is 'Metadados de links do usuário; credenciais e eventos individuais do Encurta.io não são armazenados.';
comment on table public.user_link_metric_cache is 'Cache curto somente de métricas agregadas fornecidas pelo Encurta.io.';

commit;
