begin;

alter table private.form_rate_limits
  drop constraint if exists form_rate_limits_route_check;

alter table private.form_rate_limits
  add constraint form_rate_limits_route_check
  check (route in ('analysis', 'contact', 'signup', 'form-token', 'whatsapp-shortener'));

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
    or p_route not in ('analysis', 'contact', 'signup', 'form-token', 'whatsapp-shortener')
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

commit;
