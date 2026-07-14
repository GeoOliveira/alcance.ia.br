-- Alcance IA — painel administrativo, autorização, conteúdo e auditoria
create extension if not exists pgcrypto;

create table if not exists public.admin_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete restrict,
  display_name text not null check (char_length(display_name) between 2 and 100),
  role text not null check (role in ('super_admin','admin','editor','support','analyst')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  last_login_at timestamptz
);

create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'),
  value jsonb not null,
  value_type text not null check (value_type in ('string','number','boolean','json','url','email')),
  category text not null check (category in ('general','analysis','signup','privacy','maintenance','analytics','content','limits')),
  label text not null check (char_length(label) between 2 and 100),
  description text not null default '' check (char_length(description) <= 500),
  is_public boolean not null default false,
  is_editable boolean not null default true,
  validation_schema jsonb not null default '{}'::jsonb check (jsonb_typeof(validation_schema) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  key text not null unique check (key ~ '^[a-z][a-z0-9_]*$'),
  name text not null check (char_length(name) between 2 and 100),
  description text not null default '' check (char_length(description) <= 500),
  enabled boolean not null default false,
  scope text not null default 'public' check (scope in ('public','admin','internal')),
  configuration jsonb not null default '{}'::jsonb check (jsonb_typeof(configuration) = 'object' and pg_column_size(configuration) <= 8192),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.site_content (
  id uuid primary key default gen_random_uuid(),
  section text not null check (section in ('home.hero','home.benefits','home.final_cta','home.trust','home.availability')),
  content_key text not null check (content_key ~ '^[a-z][a-z0-9_]*$'),
  content_value text not null check (char_length(content_value) between 1 and 1000 and content_value !~* '<\s*(script|iframe|object|embed|style)'),
  content_type text not null default 'text' check (content_type in ('text','short_text')),
  locale text not null default 'pt-BR' check (locale ~ '^[a-z]{2}(-[A-Z]{2})?$'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  unique (section, content_key, locale)
);

create table if not exists public.site_faqs (
  id uuid primary key default gen_random_uuid(),
  question text not null check (char_length(question) between 10 and 240 and question !~* '<\s*(script|iframe|object|embed|style)'),
  answer text not null check (char_length(answer) between 10 and 2000 and answer !~* '<\s*(script|iframe|object|embed|style)'),
  position integer not null default 0 check (position between 0 and 10000),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  admin_user_id uuid references auth.users(id) on delete set null,
  admin_role text check (admin_role in ('super_admin','admin','editor','support','analyst')),
  action text not null check (char_length(action) between 3 and 100),
  entity_type text not null check (char_length(entity_type) between 2 and 80),
  entity_id text check (char_length(entity_id) <= 200),
  before_data jsonb check (before_data is null or (jsonb_typeof(before_data) = 'object' and pg_column_size(before_data) <= 16384)),
  after_data jsonb check (after_data is null or (jsonb_typeof(after_data) = 'object' and pg_column_size(after_data) <= 16384)),
  metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object' and pg_column_size(metadata) <= 8192),
  request_id uuid
);

alter table public.analysis_requests
  add column if not exists admin_notes text,
  add column if not exists anonymized_at timestamptz,
  add column if not exists anonymized_by uuid references auth.users(id) on delete set null;

alter table public.contact_messages
  add column if not exists updated_at timestamptz not null default now(),
  add column if not exists admin_notes text,
  add column if not exists anonymized_at timestamptz,
  add column if not exists anonymized_by uuid references auth.users(id) on delete set null;

alter table public.contact_messages drop constraint if exists contact_messages_status_check;
alter table public.contact_messages add constraint contact_messages_status_check
  check (status in ('new','in_progress','answered','archived','spam','resolved')) not valid;
alter table public.contact_messages validate constraint contact_messages_status_check;

alter table public.analysis_requests
  add constraint analysis_requests_admin_notes_length_check check (char_length(coalesce(admin_notes, '')) <= 4000) not valid;
alter table public.analysis_requests validate constraint analysis_requests_admin_notes_length_check;
alter table public.contact_messages
  add constraint contact_messages_admin_notes_length_check check (char_length(coalesce(admin_notes, '')) <= 4000) not valid;
alter table public.contact_messages validate constraint contact_messages_admin_notes_length_check;

create index if not exists admin_profiles_role_active_idx on public.admin_profiles (role, is_active);
create index if not exists app_settings_category_idx on public.app_settings (category, key);
create index if not exists feature_flags_enabled_idx on public.feature_flags (enabled, key);
create index if not exists site_content_lookup_idx on public.site_content (section, locale, is_active);
create index if not exists site_faqs_active_position_idx on public.site_faqs (is_active, position);
create index if not exists admin_audit_logs_created_at_idx on public.admin_audit_logs (created_at desc);
create index if not exists admin_audit_logs_actor_idx on public.admin_audit_logs (admin_user_id, created_at desc);
create index if not exists admin_audit_logs_entity_idx on public.admin_audit_logs (entity_type, entity_id, created_at desc);
create index if not exists analysis_requests_status_created_idx on public.analysis_requests (status, created_at desc);
create index if not exists analysis_requests_username_lower_idx on public.analysis_requests (lower(instagram_username));
create index if not exists analysis_requests_utm_source_idx on public.analysis_requests (utm_source) where utm_source is not null;
create index if not exists analysis_requests_utm_campaign_idx on public.analysis_requests (utm_campaign) where utm_campaign is not null;
create index if not exists contact_messages_email_lower_idx on public.contact_messages (lower(email));

drop trigger if exists set_admin_profiles_updated_at on public.admin_profiles;
create trigger set_admin_profiles_updated_at before update on public.admin_profiles
for each row execute function public.set_updated_at();
drop trigger if exists set_app_settings_updated_at on public.app_settings;
create trigger set_app_settings_updated_at before update on public.app_settings
for each row execute function public.set_updated_at();
drop trigger if exists set_feature_flags_updated_at on public.feature_flags;
create trigger set_feature_flags_updated_at before update on public.feature_flags
for each row execute function public.set_updated_at();
drop trigger if exists set_site_content_updated_at on public.site_content;
create trigger set_site_content_updated_at before update on public.site_content
for each row execute function public.set_updated_at();
drop trigger if exists set_site_faqs_updated_at on public.site_faqs;
create trigger set_site_faqs_updated_at before update on public.site_faqs
for each row execute function public.set_updated_at();
drop trigger if exists set_contact_messages_updated_at on public.contact_messages;
create trigger set_contact_messages_updated_at before update on public.contact_messages
for each row execute function public.set_updated_at();

create or replace function public.current_admin_role()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select ap.role
  from public.admin_profiles ap
  where ap.user_id = (select auth.uid()) and ap.is_active
  limit 1
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_profiles ap
    where ap.user_id = (select auth.uid()) and ap.is_active
  )
$$;

create or replace function public.has_admin_role(p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.admin_profiles ap
    where ap.user_id = (select auth.uid()) and ap.is_active and ap.role = any(p_roles)
  )
$$;

revoke all on function public.current_admin_role() from public, anon;
revoke all on function public.is_admin() from public, anon;
revoke all on function public.has_admin_role(text[]) from public, anon;
grant execute on function public.current_admin_role() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.has_admin_role(text[]) to authenticated;

create or replace function public.protect_last_super_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'admin profiles cannot be physically deleted';
  end if;
  if old.role = 'super_admin' and old.is_active
    and (new.role <> 'super_admin' or not new.is_active)
    and (select count(*) from public.admin_profiles where role = 'super_admin' and is_active) <= 1 then
    raise exception 'cannot remove the last active super admin';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_last_super_admin on public.admin_profiles;
create trigger protect_last_super_admin before update or delete on public.admin_profiles
for each row execute function public.protect_last_super_admin();

create or replace function public.admin_write_audit(
  p_action text,
  p_entity_type text,
  p_entity_id text default null,
  p_before_data jsonb default null,
  p_after_data jsonb default null,
  p_metadata jsonb default '{}'::jsonb,
  p_request_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_role text;
begin
  v_role := public.current_admin_role();
  if v_role is null then raise exception 'admin authorization required'; end if;
  if char_length(p_action) not between 3 and 100 or char_length(p_entity_type) not between 2 and 80 then
    raise exception 'invalid audit event';
  end if;
  insert into public.admin_audit_logs (
    admin_user_id, admin_role, action, entity_type, entity_id,
    before_data, after_data, metadata, request_id
  ) values (
    (select auth.uid()), v_role, p_action, p_entity_type, p_entity_id,
    p_before_data, p_after_data, coalesce(p_metadata, '{}'::jsonb), p_request_id
  ) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.record_admin_login()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare v_role text;
begin
  v_role := public.current_admin_role();
  if v_role is null then raise exception 'admin authorization required'; end if;
  update public.admin_profiles set last_login_at = now() where user_id = (select auth.uid());
  perform public.admin_write_audit('admin_login_succeeded', 'admin_profile', (select auth.uid())::text);
end;
$$;

create or replace function public.admin_anonymize_analysis_request(p_id uuid, p_reason text default null)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare v_status text;
begin
  if not public.has_admin_role(array['super_admin']) then raise exception 'insufficient permission'; end if;
  select status into v_status from public.analysis_requests where id = p_id for update;
  if not found then return false; end if;
  update public.analysis_requests set
    instagram_username = 'anonymous_' || left(replace(p_id::text, '-', ''), 12),
    instagram_profile_url = 'https://instagram.com/anonymous',
    anonymous_session_id = gen_random_uuid(), user_id = null,
    utm_source = null, utm_medium = null, utm_campaign = null, utm_content = null, utm_term = null,
    referrer = null, landing_page = null, terms_accepted_at = null, privacy_accepted_at = null,
    metadata = '{}'::jsonb, admin_notes = null, anonymized_at = now(), anonymized_by = (select auth.uid())
  where id = p_id;
  perform public.admin_write_audit('analysis_request_anonymized', 'analysis_request', p_id::text,
    jsonb_build_object('status', v_status), jsonb_build_object('anonymized', true),
    jsonb_build_object('reason', left(coalesce(p_reason, ''), 500)));
  return true;
end;
$$;

create or replace function public.admin_delete_analysis_request(p_id uuid, p_reason text default null)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare v_status text;
begin
  if not public.has_admin_role(array['super_admin']) then raise exception 'insufficient permission'; end if;
  select status into v_status from public.analysis_requests where id = p_id for update;
  if not found then return false; end if;
  delete from public.analysis_requests where id = p_id;
  perform public.admin_write_audit('analysis_request_deleted', 'analysis_request', p_id::text,
    jsonb_build_object('status', v_status), null, jsonb_build_object('reason', left(coalesce(p_reason, ''), 500)));
  return true;
end;
$$;

create or replace function public.admin_delete_contact_message(p_id uuid, p_reason text default null)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare v_status text;
begin
  if not public.has_admin_role(array['super_admin']) then raise exception 'insufficient permission'; end if;
  select status into v_status from public.contact_messages where id = p_id for update;
  if not found then return false; end if;
  delete from public.contact_messages where id = p_id;
  perform public.admin_write_audit('contact_message_deleted', 'contact_message', p_id::text,
    jsonb_build_object('status', v_status), null, jsonb_build_object('reason', left(coalesce(p_reason, ''), 500)));
  return true;
end;
$$;

revoke all on function public.admin_write_audit(text,text,text,jsonb,jsonb,jsonb,uuid) from public, anon;
revoke all on function public.record_admin_login() from public, anon;
revoke all on function public.admin_anonymize_analysis_request(uuid,text) from public, anon;
revoke all on function public.admin_delete_analysis_request(uuid,text) from public, anon;
revoke all on function public.admin_delete_contact_message(uuid,text) from public, anon;
grant execute on function public.admin_write_audit(text,text,text,jsonb,jsonb,jsonb,uuid) to authenticated;
grant execute on function public.record_admin_login() to authenticated;
grant execute on function public.admin_anonymize_analysis_request(uuid,text) to authenticated;
grant execute on function public.admin_delete_analysis_request(uuid,text) to authenticated;
grant execute on function public.admin_delete_contact_message(uuid,text) to authenticated;

create or replace function public.admin_export_analysis_requests(
  p_limit integer default 1000,
  p_search text default null,
  p_status text default null,
  p_source text default null,
  p_campaign text default null,
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_oldest_first boolean default false
)
returns table (
  id uuid, profile text, status text, created_at timestamptz,
  utm_source text, utm_campaign text, has_user boolean, expires_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare v_role text;
begin
  v_role := public.current_admin_role();
  if v_role not in ('super_admin','admin','analyst') then raise exception 'insufficient permission'; end if;
  if p_limit not between 1 and 5000 then raise exception 'invalid export limit'; end if;
  return query
    select ar.id,
      case when v_role = 'analyst' then '[minimizado]' else ar.instagram_username end,
      ar.status, ar.created_at, ar.utm_source, ar.utm_campaign,
      ar.user_id is not null, ar.expires_at
    from public.analysis_requests ar
    where (p_search is null or ar.instagram_username ilike '%' || replace(replace(left(p_search, 30), '%', ''), '_', '') || '%')
      and (p_status is null or ar.status = left(p_status, 40))
      and (p_source is null or ar.utm_source = left(p_source, 200))
      and (p_campaign is null or ar.utm_campaign = left(p_campaign, 200))
      and (p_from is null or ar.created_at >= p_from)
      and (p_to is null or ar.created_at <= p_to)
    order by
      case when p_oldest_first then ar.created_at end asc,
      case when not p_oldest_first then ar.created_at end desc
    limit p_limit;
end;
$$;
revoke all on function public.admin_export_analysis_requests(integer,text,text,text,text,timestamptz,timestamptz,boolean) from public, anon;
grant execute on function public.admin_export_analysis_requests(integer,text,text,text,text,timestamptz,timestamptz,boolean) to authenticated;

create or replace function public.admin_dashboard_metrics()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare v_since timestamptz := now() - interval '7 days';
begin
  if not public.is_admin() then raise exception 'admin authorization required'; end if;
  return jsonb_build_object(
    'counts', jsonb_build_object(
      'today', (select count(*) from public.analysis_requests where created_at >= date_trunc('day', now())),
      'week', (select count(*) from public.analysis_requests where created_at >= v_since),
      'pending', (select count(*) from public.analysis_requests where status = 'pending'),
      'failed', (select count(*) from public.analysis_requests where status = 'failed'),
      'contacts', (select count(*) from public.contact_messages where status in ('new','in_progress'))
    ),
    'by_status', coalesce((select jsonb_object_agg(status, total) from (
      select status, count(*) as total from public.analysis_requests where created_at >= v_since group by status
    ) grouped_status), '{}'::jsonb),
    'sources', coalesce((select jsonb_object_agg(source, total) from (
      select coalesce(utm_source, 'direto') as source, count(*) as total
      from public.analysis_requests where created_at >= v_since group by coalesce(utm_source, 'direto')
      order by total desc limit 5
    ) grouped_source), '{}'::jsonb),
    'campaigns', coalesce((select jsonb_object_agg(campaign, total) from (
      select coalesce(utm_campaign, 'sem campanha') as campaign, count(*) as total
      from public.analysis_requests where created_at >= v_since group by coalesce(utm_campaign, 'sem campanha')
      order by total desc limit 5
    ) grouped_campaign), '{}'::jsonb)
  );
end;
$$;
revoke all on function public.admin_dashboard_metrics() from public, anon;
grant execute on function public.admin_dashboard_metrics() to authenticated;

alter table public.admin_profiles enable row level security;
alter table public.app_settings enable row level security;
alter table public.feature_flags enable row level security;
alter table public.site_content enable row level security;
alter table public.site_faqs enable row level security;
alter table public.admin_audit_logs enable row level security;

revoke all on public.admin_profiles, public.app_settings, public.feature_flags,
  public.site_content, public.site_faqs, public.admin_audit_logs from anon, authenticated;
grant select on public.admin_profiles, public.app_settings, public.feature_flags,
  public.site_content, public.site_faqs to authenticated;
grant insert, update on public.admin_profiles to authenticated;
grant update on public.app_settings, public.feature_flags, public.site_content to authenticated;
grant insert, update, delete on public.site_faqs to authenticated;
grant select on public.admin_audit_logs to authenticated;
grant select, update, delete on public.analysis_requests to authenticated;
grant select, update, delete on public.contact_messages to authenticated;

drop policy if exists admin_profiles_select on public.admin_profiles;
create policy admin_profiles_select on public.admin_profiles for select to authenticated
using (user_id = (select auth.uid()) or public.has_admin_role(array['super_admin','admin']));
drop policy if exists admin_profiles_insert on public.admin_profiles;
create policy admin_profiles_insert on public.admin_profiles for insert to authenticated
with check (public.has_admin_role(array['super_admin']) and role in ('admin','editor','support','analyst'));
drop policy if exists admin_profiles_update on public.admin_profiles;
create policy admin_profiles_update on public.admin_profiles for update to authenticated
using (public.has_admin_role(array['super_admin'])) with check (public.has_admin_role(array['super_admin']));

drop policy if exists app_settings_select on public.app_settings;
create policy app_settings_select on public.app_settings for select to authenticated using (public.is_admin());
drop policy if exists app_settings_update on public.app_settings;
create policy app_settings_update on public.app_settings for update to authenticated
using (public.has_admin_role(array['super_admin','admin']) and is_editable)
with check (public.has_admin_role(array['super_admin','admin']) and is_editable);

drop policy if exists feature_flags_select on public.feature_flags;
create policy feature_flags_select on public.feature_flags for select to authenticated using (public.is_admin());
drop policy if exists feature_flags_update on public.feature_flags;
create policy feature_flags_update on public.feature_flags for update to authenticated
using (public.has_admin_role(array['super_admin'])) with check (public.has_admin_role(array['super_admin']));

drop policy if exists site_content_select on public.site_content;
create policy site_content_select on public.site_content for select to authenticated using (public.is_admin());
drop policy if exists site_content_update on public.site_content;
create policy site_content_update on public.site_content for update to authenticated
using (public.has_admin_role(array['super_admin','admin','editor']))
with check (public.has_admin_role(array['super_admin','admin','editor']));

drop policy if exists site_faqs_select on public.site_faqs;
create policy site_faqs_select on public.site_faqs for select to authenticated using (public.is_admin());
drop policy if exists site_faqs_insert on public.site_faqs;
create policy site_faqs_insert on public.site_faqs for insert to authenticated
with check (public.has_admin_role(array['super_admin','admin','editor']));
drop policy if exists site_faqs_update on public.site_faqs;
create policy site_faqs_update on public.site_faqs for update to authenticated
using (public.has_admin_role(array['super_admin','admin','editor']))
with check (public.has_admin_role(array['super_admin','admin','editor']));
drop policy if exists site_faqs_delete on public.site_faqs;
create policy site_faqs_delete on public.site_faqs for delete to authenticated
using (public.has_admin_role(array['super_admin','admin']));

drop policy if exists admin_audit_logs_select on public.admin_audit_logs;
create policy admin_audit_logs_select on public.admin_audit_logs for select to authenticated
using (public.has_admin_role(array['super_admin','admin']));

drop policy if exists admin_analysis_requests_select on public.analysis_requests;
create policy admin_analysis_requests_select on public.analysis_requests for select to authenticated
using (public.has_admin_role(array['super_admin','admin','support']));
drop policy if exists admin_analysis_requests_update on public.analysis_requests;
create policy admin_analysis_requests_update on public.analysis_requests for update to authenticated
using (public.has_admin_role(array['super_admin','admin','support']))
with check (public.has_admin_role(array['super_admin','admin','support']));
drop policy if exists admin_analysis_requests_delete on public.analysis_requests;
create policy admin_analysis_requests_delete on public.analysis_requests for delete to authenticated
using (public.has_admin_role(array['super_admin']));

drop policy if exists admin_contact_messages_select on public.contact_messages;
create policy admin_contact_messages_select on public.contact_messages for select to authenticated
using (public.has_admin_role(array['super_admin','admin','support']));
drop policy if exists admin_contact_messages_update on public.contact_messages;
create policy admin_contact_messages_update on public.contact_messages for update to authenticated
using (public.has_admin_role(array['super_admin','admin','support']))
with check (public.has_admin_role(array['super_admin','admin','support']));
drop policy if exists admin_contact_messages_delete on public.contact_messages;
create policy admin_contact_messages_delete on public.contact_messages for delete to authenticated
using (public.has_admin_role(array['super_admin']));

insert into public.app_settings (key, value, value_type, category, label, description, is_public, validation_schema)
values
  ('general.site_name', '"Alcance IA"'::jsonb, 'string', 'general', 'Nome do site', 'Nome público da plataforma.', true, '{"minLength":2,"maxLength":80}'),
  ('general.contact_email', '"contato@alcance.ia.br"'::jsonb, 'email', 'general', 'E-mail de contato', 'Endereço público de contato.', true, '{}'),
  ('general.support_email', '"contato@alcance.ia.br"'::jsonb, 'email', 'general', 'E-mail de suporte', 'Endereço público de suporte.', true, '{}'),
  ('general.public_url', '"https://alcance.ia.br"'::jsonb, 'url', 'general', 'URL pública', 'URL canônica do site.', true, '{}'),
  ('analysis.enabled', 'true'::jsonb, 'boolean', 'analysis', 'Solicitações habilitadas', 'Permite novas solicitações de análise.', true, '{}'),
  ('analysis.demo_mode', 'true'::jsonb, 'boolean', 'analysis', 'Modo demonstrativo', 'Mantém a experiência identificada como demonstração.', true, '{}'),
  ('analysis.daily_limit', '1000'::jsonb, 'number', 'limits', 'Limite diário', 'Limite operacional diário de solicitações.', false, '{"min":1,"max":100000}'),
  ('analysis.profile_cache_hours', '24'::jsonb, 'number', 'analysis', 'Cache do perfil', 'Horas de cache futuro para dados autorizados.', false, '{"min":1,"max":720}'),
  ('analysis.anonymous_retention_days', '30'::jsonb, 'number', 'privacy', 'Retenção anônima', 'Dias de retenção das solicitações anônimas.', false, '{"min":1,"max":365}'),
  ('analysis.maximum_posts', '12'::jsonb, 'number', 'analysis', 'Máximo de publicações', 'Limite futuro de itens analisados.', false, '{"min":1,"max":100}'),
  ('analysis.request_cooldown_minutes', '5'::jsonb, 'number', 'limits', 'Intervalo entre solicitações', 'Intervalo operacional mínimo em minutos.', false, '{"min":0,"max":1440}'),
  ('signup.enabled', 'false'::jsonb, 'boolean', 'signup', 'Cadastro habilitado', 'Ativa o fluxo de cadastro quando implementado.', true, '{}'),
  ('signup.google_enabled', 'false'::jsonb, 'boolean', 'signup', 'Login Google', 'Ativa login Google quando implementado.', true, '{}'),
  ('signup.email_enabled', 'false'::jsonb, 'boolean', 'signup', 'Login por e-mail', 'Ativa login público por e-mail quando implementado.', true, '{}'),
  ('maintenance.enabled', 'false'::jsonb, 'boolean', 'maintenance', 'Modo de manutenção', 'Substitui páginas públicas pela mensagem de manutenção.', true, '{}'),
  ('maintenance.title', '"Voltamos em breve"'::jsonb, 'string', 'maintenance', 'Título da manutenção', 'Título exibido durante manutenção.', true, '{"minLength":3,"maxLength":120}'),
  ('maintenance.message', '"Estamos realizando melhorias para oferecer uma experiência ainda melhor."'::jsonb, 'string', 'maintenance', 'Mensagem da manutenção', 'Mensagem pública durante manutenção.', true, '{"minLength":10,"maxLength":500}'),
  ('analytics.ga4_enabled', 'true'::jsonb, 'boolean', 'analytics', 'Google Analytics 4', 'Controla o carregamento do GA4.', true, '{}'),
  ('analytics.ga4_measurement_id', '""'::jsonb, 'string', 'analytics', 'ID do GA4', 'ID público G-; a variável de ambiente é o fallback.', true, '{"maxLength":30}'),
  ('analytics.clarity_enabled', 'true'::jsonb, 'boolean', 'analytics', 'Microsoft Clarity', 'Controla o carregamento do Clarity.', true, '{}'),
  ('analytics.clarity_project_id', '""'::jsonb, 'string', 'analytics', 'ID do Clarity', 'ID público; a variável de ambiente é o fallback.', true, '{"maxLength":50}'),
  ('analytics.environment', '"production"'::jsonb, 'string', 'analytics', 'Ambiente de analytics', 'Ambiente autorizado: production, preview, development ou all.', true, '{}'),
  ('privacy.cookie_consent_version', '"1"'::jsonb, 'string', 'privacy', 'Versão do consentimento', 'Versão do registro de preferências.', true, '{"minLength":1,"maxLength":20}'),
  ('privacy.policy_version', '"2026-07"'::jsonb, 'string', 'privacy', 'Versão da política', 'Versão pública da política de privacidade.', true, '{"minLength":1,"maxLength":30}')
on conflict (key) do nothing;

insert into public.feature_flags (key, name, description, enabled, scope)
values
  ('instagram_analysis', 'Análise do Instagram', 'Fluxo público de solicitação de análise.', true, 'public'),
  ('analysis_preview', 'Prévia da análise', 'Exibe a prévia demonstrativa.', true, 'public'),
  ('user_signup', 'Cadastro de usuários', 'Cadastro público futuro.', false, 'public'),
  ('google_login', 'Login com Google', 'Autenticação pública futura com Google.', false, 'public'),
  ('email_login', 'Login por e-mail', 'Autenticação pública futura por e-mail.', false, 'public'),
  ('contact_form', 'Formulário de contato', 'Recebimento de mensagens públicas.', true, 'public'),
  ('public_faq', 'FAQ público', 'Exibição das perguntas frequentes.', true, 'public'),
  ('maintenance_mode', 'Modo de manutenção', 'Espelho operacional do modo de manutenção.', false, 'public'),
  ('content_generation', 'Geração de conteúdo', 'Recurso futuro; ainda não implementado.', false, 'internal')
on conflict (key) do nothing;

insert into public.site_content (section, content_key, content_value, content_type)
values
  ('home.hero', 'title', 'Entenda seu perfil. Amplie suas possibilidades.', 'short_text'),
  ('home.hero', 'subtitle', 'Analise seu perfil do Instagram e descubra oportunidades para melhorar sua bio, seu conteúdo e seu engajamento.', 'text'),
  ('home.hero', 'primary_button', 'Analisar meu perfil', 'short_text'),
  ('home.hero', 'security_notice', 'Não pedimos sua senha do Instagram.', 'short_text'),
  ('home.benefits', 'title', 'Menos ruído. Mais direção.', 'short_text'),
  ('home.final_cta', 'title', 'Seu próximo passo pode começar com uma leitura melhor.', 'short_text'),
  ('home.final_cta', 'text', 'Informe seu perfil e conheça a experiência inicial da Alcance IA.', 'text'),
  ('home.final_cta', 'button', 'Analisar meu perfil', 'short_text'),
  ('home.availability', 'unavailable_message', 'As solicitações estão temporariamente indisponíveis.', 'text'),
  ('home.trust', 'items', 'Sem senha · Sem compromisso · Privacidade desde o início', 'text')
on conflict (section, content_key, locale) do nothing;

insert into public.site_faqs (question, answer, position)
values
  ('A Alcance IA pede minha senha do Instagram?', 'Não. Nunca solicitamos a senha do Instagram. A proposta utiliza somente informações públicas ou dados autorizados explicitamente.', 10),
  ('A análise completa já está disponível?', 'Ainda não. Esta primeira versão demonstra o formato da experiência e registra solicitações para uma próxima fase.', 20),
  ('Os dados mostrados na prévia são do meu perfil?', 'Não. A prévia é claramente ilustrativa e não associa métricas inventadas ao perfil informado.', 30),
  ('A plataforma garante crescimento?', 'Não. A Alcance IA pretende apoiar decisões, mas não garante alcance, engajamento, crescimento ou qualquer resultado específico.', 40)
on conflict do nothing;

comment on table public.admin_profiles is 'Perfis administrativos vinculados ao Supabase Auth; não permite cadastro público.';
comment on table public.app_settings is 'Lista fechada de configurações operacionais; nunca armazena segredos.';
comment on table public.feature_flags is 'Flags conhecidas pela aplicação; ativar uma flag não cria funcionalidade inexistente.';
comment on table public.site_content is 'Campos de conteúdo público controlados, sem HTML arbitrário.';
comment on table public.site_faqs is 'Perguntas frequentes gerenciáveis e validadas.';
comment on table public.admin_audit_logs is 'Registro imutável das ações administrativas relevantes.';
comment on function public.current_admin_role() is 'Obtém a função do administrador ativo sem recursão de RLS.';
comment on function public.admin_write_audit(text,text,text,jsonb,jsonb,jsonb,uuid) is 'Insere auditoria derivando usuário e função da sessão autenticada.';
comment on function public.admin_dashboard_metrics() is 'Fornece somente métricas agregadas do dashboard para administradores ativos.';
