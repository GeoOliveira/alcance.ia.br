begin;

alter table private.form_rate_limits
  drop constraint if exists form_rate_limits_route_check;

alter table private.form_rate_limits
  add constraint form_rate_limits_route_check
  check (route in ('analysis', 'contact', 'signup', 'form-token', 'feature-interest', 'whatsapp-shortener'));

create table if not exists private.rate_limit_idempotency_keys (
  key_hash text not null check (char_length(key_hash) = 64),
  route text not null check (route in ('analysis', 'contact', 'signup', 'form-token', 'feature-interest', 'whatsapp-shortener')),
  idempotency_key_hash text not null check (char_length(idempotency_key_hash) = 64),
  recorded_at timestamptz not null default clock_timestamp(),
  primary key (key_hash, route, idempotency_key_hash)
);

create index if not exists rate_limit_idempotency_keys_recorded_at_idx
  on private.rate_limit_idempotency_keys (recorded_at);

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
    or p_route not in ('analysis', 'contact', 'signup', 'form-token', 'feature-interest', 'whatsapp-shortener')
    or p_limit not between 1 and 100000
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

create or replace function public.consume_idempotent_rate_limit(
  p_key_hash text,
  p_route text,
  p_limit integer,
  p_window_seconds integer,
  p_idempotency_key_hash text
)
returns table (allowed boolean, retry_after integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
  v_started_at timestamptz;
  v_should_consume boolean;
begin
  if char_length(p_key_hash) <> 64
    or char_length(p_idempotency_key_hash) <> 64
    or p_route not in ('analysis', 'contact', 'signup', 'form-token', 'feature-interest', 'whatsapp-shortener')
    or p_limit not between 1 and 100000
    or p_window_seconds not between 1 and 86400 then
    raise exception 'invalid rate limit parameters';
  end if;

  delete from private.rate_limit_idempotency_keys
  where key_hash = p_key_hash
    and route = p_route
    and recorded_at <= clock_timestamp() - make_interval(secs => p_window_seconds);

  insert into private.rate_limit_idempotency_keys (key_hash, route, idempotency_key_hash, recorded_at)
  values (p_key_hash, p_route, p_idempotency_key_hash, clock_timestamp())
  on conflict (key_hash, route, idempotency_key_hash) do nothing
  returning true into v_should_consume;

  if not coalesce(v_should_consume, false) then
    allowed := true;
    retry_after := 0;
    return next;
    return;
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

  if not allowed then
    delete from private.rate_limit_idempotency_keys
    where key_hash = p_key_hash
      and route = p_route
      and idempotency_key_hash = p_idempotency_key_hash;
  end if;

  return next;
end;
$$;

revoke all on table private.rate_limit_idempotency_keys from public, anon, authenticated;
revoke all on function public.consume_form_rate_limit(text, text, integer, integer) from public, anon, authenticated;
revoke all on function public.consume_idempotent_rate_limit(text, text, integer, integer, text) from public, anon, authenticated;
grant execute on function public.consume_form_rate_limit(text, text, integer, integer) to service_role;
grant execute on function public.consume_idempotent_rate_limit(text, text, integer, integer, text) to service_role;

update public.app_settings
set value = '20'::jsonb,
    description = 'Limite diário de links curtos válidos por visitante. Repetições da mesma solicitação não consomem novamente.'
where key = 'whatsapp_link_shortener.anonymous_daily_limit'
  and value = '3'::jsonb;

update public.app_settings
set value = '50'::jsonb
where key = 'whatsapp_link_shortener.free_daily_limit'
  and value = '10'::jsonb;

update public.app_settings
set value = '500'::jsonb
where key = 'whatsapp_link_shortener.premium_daily_limit'
  and value = '100'::jsonb;

comment on table private.rate_limit_idempotency_keys is 'Hashes temporários que impedem retries de consumir a mesma cota mais de uma vez.';
comment on function public.consume_idempotent_rate_limit(text, text, integer, integer, text) is 'Consome a cota de forma atômica e ignora repetições da mesma chave durante a janela.';

commit;
