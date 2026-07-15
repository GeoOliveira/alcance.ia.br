-- Revisão manual de retenção. Este arquivo NÃO exclui dados automaticamente.
select id, status, created_at, expires_at,
  case when input_snapshot is not null and created_at < now() - interval '7 days' then true else false end as input_expired,
  case when status in ('failed','retryable_failed') and created_at < now() - interval '30 days' then true else false end as error_expired,
  case when output_snapshot is not null and created_at < now() - interval '90 days' then true else false end as output_expired
from public.ai_analysis_runs
where created_at < now() - interval '7 days'
order by created_at;

-- Após aprovação operacional, execute em transação e ajuste os prazos às settings:
-- update public.ai_analysis_runs set input_snapshot = null where input_snapshot is not null and created_at < now() - interval '7 days';
-- delete from public.ai_analysis_runs where status in ('failed','retryable_failed') and created_at < now() - interval '30 days';
-- delete from public.ai_analysis_runs where output_snapshot is not null and created_at < now() - interval '90 days';
