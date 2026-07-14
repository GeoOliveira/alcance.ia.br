-- Alcance IA — proteção distribuída, idempotência e políticas de acesso
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

alter table public.analysis_requests add column if not exists idempotency_key uuid;
alter table public.contact_messages add column if not exists idempotency_key uuid;

create unique index if not exists analysis_requests_idempotency_key_idx
  on public.analysis_requests (idempotency_key) where idempotency_key is not null;
create unique index if not exists contact_messages_idempotency_key_idx
  on public.contact_messages (idempotency_key) where idempotency_key is not null;
create index if not exists analysis_requests_session_profile_recent_idx
  on public.analysis_requests (anonymous_session_id, instagram_username, created_at desc);

alter table public.analysis_requests
  add constraint analysis_requests_profile_url_length_check check (char_length(instagram_profile_url) <= 200) not valid,
  add constraint analysis_requests_campaign_lengths_check check (
    char_length(coalesce(utm_source, '')) <= 200 and
    char_length(coalesce(utm_medium, '')) <= 200 and
    char_length(coalesce(utm_campaign, '')) <= 200 and
    char_length(coalesce(utm_content, '')) <= 200 and
    char_length(coalesce(utm_term, '')) <= 200
  ) not valid,
  add constraint analysis_requests_referrer_length_check check (char_length(coalesce(referrer, '')) <= 500) not valid,
  add constraint analysis_requests_landing_page_length_check check (char_length(coalesce(landing_page, '')) <= 300) not valid,
  add constraint analysis_requests_metadata_shape_check check (
    jsonb_typeof(metadata) = 'object' and pg_column_size(metadata) <= 8192
  ) not valid;

alter table public.analysis_requests validate constraint analysis_requests_profile_url_length_check;
alter table public.analysis_requests validate constraint analysis_requests_campaign_lengths_check;
alter table public.analysis_requests validate constraint analysis_requests_referrer_length_check;
alter table public.analysis_requests validate constraint analysis_requests_landing_page_length_check;
alter table public.analysis_requests validate constraint analysis_requests_metadata_shape_check;

create table if not exists private.form_rate_limits (
  key_hash text not null check (char_length(key_hash) = 64),
  route text not null check (route in ('analysis', 'contact', 'signup', 'form-token')),
  window_started_at timestamptz not null,
  request_count integer not null check (request_count > 0),
  primary key (key_hash, route)
);

create or replace function public.consume_form_rate_limit(
  p_key_hash text,
  p_route text,
  p_limit integer,
  p_window_seconds integer
)
returns table (allowed boolean, retry_after integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
  v_started_at timestamptz;
begin
  if char_length(p_key_hash) <> 64
    or p_route not in ('analysis', 'contact', 'signup', 'form-token')
    or p_limit not between 1 and 1000
    or p_window_seconds not between 1 and 86400 then
    raise exception 'invalid rate limit parameters';
  end if;

  insert into private.form_rate_limits (key_hash, route, window_started_at, request_count)
  values (p_key_hash, p_route, clock_timestamp(), 1)
  on conflict (key_hash, route) do update
  set request_count = case
        when private.form_rate_limits.window_started_at <= clock_timestamp() - make_interval(secs => p_window_seconds)
          then 1
        else private.form_rate_limits.request_count + 1
      end,
      window_started_at = case
        when private.form_rate_limits.window_started_at <= clock_timestamp() - make_interval(secs => p_window_seconds)
          then clock_timestamp()
        else private.form_rate_limits.window_started_at
      end
  returning request_count, window_started_at into v_count, v_started_at;

  allowed := v_count <= p_limit;
  retry_after := case when allowed then 0 else greatest(
    1,
    ceil(extract(epoch from (v_started_at + make_interval(secs => p_window_seconds) - clock_timestamp())))::integer
  ) end;
  return next;
end;
$$;

revoke all on function public.consume_form_rate_limit(text, text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_form_rate_limit(text, text, integer, integer) to service_role;

create or replace function public.create_analysis_request_secure(
  p_idempotency_key uuid,
  p_instagram_username text,
  p_instagram_profile_url text,
  p_anonymous_session_id uuid,
  p_utm_source text,
  p_utm_medium text,
  p_utm_campaign text,
  p_utm_content text,
  p_utm_term text,
  p_referrer text,
  p_landing_page text,
  p_metadata jsonb,
  p_expires_at timestamptz,
  p_dedup_window_seconds integer
)
returns table (request_id uuid, created boolean)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request_id uuid;
begin
  if p_dedup_window_seconds not between 1 and 3600 then
    raise exception 'invalid deduplication window';
  end if;

  select ar.id into v_request_id
  from public.analysis_requests ar
  where ar.idempotency_key = p_idempotency_key;
  if v_request_id is not null then
    return query select v_request_id, false;
    return;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_anonymous_session_id::text || ':' || p_instagram_username, 0)
  );

  select ar.id into v_request_id
  from public.analysis_requests ar
  where ar.idempotency_key = p_idempotency_key
     or (
       ar.anonymous_session_id = p_anonymous_session_id
       and ar.instagram_username = p_instagram_username
       and ar.created_at >= clock_timestamp() - make_interval(secs => p_dedup_window_seconds)
     )
  order by ar.created_at desc
  limit 1;
  if v_request_id is not null then
    return query select v_request_id, false;
    return;
  end if;

  insert into public.analysis_requests (
    idempotency_key, instagram_username, instagram_profile_url, anonymous_session_id,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term,
    referrer, landing_page, metadata, expires_at, status
  ) values (
    p_idempotency_key, p_instagram_username, p_instagram_profile_url, p_anonymous_session_id,
    p_utm_source, p_utm_medium, p_utm_campaign, p_utm_content, p_utm_term,
    p_referrer, p_landing_page, p_metadata, p_expires_at, 'pending'
  ) returning id into v_request_id;

  return query select v_request_id, true;
end;
$$;

revoke all on function public.create_analysis_request_secure(
  uuid, text, text, uuid, text, text, text, text, text, text, text, jsonb, timestamptz, integer
) from public, anon, authenticated;
grant execute on function public.create_analysis_request_secure(
  uuid, text, text, uuid, text, text, text, text, text, text, text, jsonb, timestamptz, integer
) to service_role;

drop policy if exists "Users can read their own analysis requests" on public.analysis_requests;
-- Não há acesso anônimo. Esta policy antecipa Auth e limita cada usuário
-- autenticado estritamente às solicitações vinculadas ao próprio auth.uid().
create policy "Users can read their own analysis requests"
  on public.analysis_requests for select to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.analysis_requests from anon, authenticated;
grant select on public.analysis_requests to authenticated;
revoke all on public.contact_messages from anon, authenticated;

create or replace function public.mark_expired_analysis_requests(p_limit integer default 1000)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated integer;
begin
  if p_limit not between 1 and 10000 then raise exception 'invalid batch size'; end if;
  with candidates as (
    select ar.id from public.analysis_requests ar
    where ar.expires_at <= clock_timestamp() and ar.status <> 'expired'
    order by ar.expires_at
    limit p_limit
    for update skip locked
  )
  update public.analysis_requests ar
  set status = 'expired'
  from candidates c
  where ar.id = c.id;
  get diagnostics v_updated = row_count;
  return v_updated;
end;
$$;

revoke all on function public.mark_expired_analysis_requests(integer) from public, anon, authenticated;
grant execute on function public.mark_expired_analysis_requests(integer) to service_role;

comment on table private.form_rate_limits is 'Contadores distribuídos; armazena somente hash irreversível do IP.';
comment on function public.mark_expired_analysis_requests(integer) is 'Marca solicitações vencidas em lotes; a exclusão permanece uma decisão operacional explícita.';
