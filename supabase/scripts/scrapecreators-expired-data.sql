-- Somente identifica dados expirados. Revise antes de executar qualquer limpeza.
select id, endpoint, input_identifier, raw_expires_at, expires_at,
  (raw_response is not null and raw_expires_at <= now()) as raw_expired,
  (expires_at <= now()) as run_expired
from public.provider_test_runs
where (raw_response is not null and raw_expires_at <= now()) or expires_at <= now()
order by created_at;

-- Rotina manual sugerida e intencionalmente comentada:
-- update public.provider_test_runs set raw_response = null where raw_expires_at <= now();
-- delete from public.provider_test_runs where expires_at <= now();
