-- Execute primeiro a consulta de inspeção. A função apenas altera o status e não apaga dados.
select id, created_at, expires_at, status
from public.analysis_requests
where expires_at <= now() and status <> 'expired'
order by expires_at
limit 100;

-- Após revisar os candidatos, remova o comentário para marcar até 1.000 registros.
-- select public.mark_expired_analysis_requests(1000);

-- Contadores antigos podem ser removidos sem dados pessoais em texto puro.
-- delete from private.form_rate_limits where window_started_at < now() - interval '2 days';
