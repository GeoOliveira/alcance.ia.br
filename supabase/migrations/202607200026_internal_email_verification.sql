begin;

alter table public.user_profiles
  add column if not exists email_verified_at timestamptz null;

-- Contas existentes que já passaram pela confirmação nativa permanecem verificadas.
update public.user_profiles profile
set email_verified_at = coalesce(auth_user.email_confirmed_at, auth_user.confirmed_at)
from auth.users auth_user
where profile.user_id = auth_user.id
  and profile.email_verified_at is null
  and coalesce(auth_user.email_confirmed_at, auth_user.confirmed_at) is not null;

create table if not exists public.user_email_verification_tokens (
  user_id uuid primary key references auth.users(id) on delete cascade,
  token_hash text not null unique check (char_length(token_hash) = 64),
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists user_email_verification_tokens_expires_idx
  on public.user_email_verification_tokens (expires_at);

alter table public.user_email_verification_tokens enable row level security;
revoke all on public.user_email_verification_tokens from public, anon, authenticated;

-- O cliente pode editar preferências, mas nunca pode se autodeclarar verificado.
revoke update on public.user_profiles from authenticated;
grant update (display_name, avatar_url, marketing_consent, preferences, last_activity_at) on public.user_profiles to authenticated;

create or replace function public.create_user_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_profiles (user_id, display_name, avatar_url, email_verified_at)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', ''), 120),
    left(new.raw_user_meta_data->>'avatar_url', 1000),
    case when coalesce(new.raw_app_meta_data->>'provider', 'email') = 'email' then null else now() end
  )
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

comment on table public.user_email_verification_tokens is 'Tokens de uso único armazenados somente como SHA-256 para verificação interna de e-mail.';
comment on column public.user_profiles.email_verified_at is 'Confirmação de e-mail controlada pela Alcance IA; independente do bloqueio de login do provedor de autenticação.';

commit;
