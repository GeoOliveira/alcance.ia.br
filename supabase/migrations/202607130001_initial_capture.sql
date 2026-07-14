-- Alcance IA — captura inicial de solicitações e contatos
create extension if not exists pgcrypto;

create table if not exists public.analysis_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  instagram_username text not null check (char_length(instagram_username) between 1 and 30),
  instagram_profile_url text not null,
  status text not null default 'pending' check (status in ('pending','processing','preview_ready','completed','failed','cancelled','expired')),
  anonymous_session_id uuid not null,
  user_id uuid references auth.users(id) on delete set null,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  referrer text,
  landing_page text,
  terms_accepted_at timestamptz,
  privacy_accepted_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  expires_at timestamptz not null default (now() + interval '30 days')
);

create index if not exists analysis_requests_created_at_idx on public.analysis_requests (created_at desc);
create index if not exists analysis_requests_user_id_idx on public.analysis_requests (user_id) where user_id is not null;
create index if not exists analysis_requests_expires_at_idx on public.analysis_requests (expires_at);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 100),
  email text not null check (char_length(email) between 3 and 160),
  subject text not null check (subject in ('analysis','support','privacy','partnerships','press','other')),
  message text not null check (char_length(message) between 10 and 3000),
  privacy_accepted_at timestamptz not null,
  status text not null default 'new' check (status in ('new','in_progress','resolved','spam'))
);

create index if not exists contact_messages_created_at_idx on public.contact_messages (created_at desc);
create index if not exists contact_messages_status_idx on public.contact_messages (status);

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists set_analysis_requests_updated_at on public.analysis_requests;
create trigger set_analysis_requests_updated_at before update on public.analysis_requests
for each row execute function public.set_updated_at();

alter table public.analysis_requests enable row level security;
alter table public.contact_messages enable row level security;

-- Não há políticas públicas de SELECT ou INSERT. As rotas do servidor usam
-- exclusivamente service_role, que permanece fora do navegador e ignora RLS.
-- Políticas autenticadas específicas devem ser adicionadas junto com Supabase Auth.
revoke all on public.analysis_requests from anon, authenticated;
revoke all on public.contact_messages from anon, authenticated;
