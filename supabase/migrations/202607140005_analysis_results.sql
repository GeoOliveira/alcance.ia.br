begin;

create table if not exists public.analysis_results (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.analysis_requests(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  provider text not null check (provider = 'scrapecreators'),
  data_quality text not null check (data_quality in ('complete','partial','insufficient','private')),
  profile_data jsonb check (
    profile_data is null
    or (jsonb_typeof(profile_data) = 'object' and pg_column_size(profile_data) <= 65536)
  ),
  posts_data jsonb not null default '[]'::jsonb check (jsonb_typeof(posts_data) = 'array' and pg_column_size(posts_data) <= 524288),
  metrics jsonb not null default '{}'::jsonb check (jsonb_typeof(metrics) = 'object' and pg_column_size(metrics) <= 32768),
  observations jsonb not null default '[]'::jsonb check (jsonb_typeof(observations) = 'array' and pg_column_size(observations) <= 32768),
  items_count integer not null default 0 check (items_count >= 0),
  fetched_at timestamptz not null,
  source_metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(source_metadata) = 'object' and pg_column_size(source_metadata) <= 16384)
);

create index if not exists analysis_results_created_at_idx on public.analysis_results (created_at desc);
create index if not exists analysis_results_fetched_at_idx on public.analysis_results (fetched_at desc);
drop trigger if exists set_analysis_results_updated_at on public.analysis_results;
create trigger set_analysis_results_updated_at before update on public.analysis_results
for each row execute function public.set_updated_at();

alter table public.analysis_results enable row level security;
revoke all on public.analysis_results from public, anon, authenticated;

comment on table public.analysis_results is 'Resultados públicos normalizados e métricas determinísticas. A leitura passa pelo servidor e valida a sessão anônima da solicitação.';
commit;
