begin;

insert into public.feature_flags (key,name,description,enabled,scope) values
  ('encurta_integration','Integração Encurta.io','Permite chamadas server-to-server para o Encurta.io.',false,'public'),
  ('whatsapp_link_shortener','Encurtador de link WhatsApp','Cria links curtos para destinos oficiais do WhatsApp.',false,'public'),
  ('whatsapp_link_shortener_anonymous','Encurtador para visitantes','Permite encurtamento sem conta quando o recurso estiver ativo.',false,'public'),
  ('whatsapp_link_shortener_free','Encurtador para usuários gratuitos','Permite encurtamento para usuários gratuitos.',false,'public'),
  ('whatsapp_link_shortener_premium','Encurtador para usuários premium','Permite encurtamento para usuários premium.',false,'public'),
  ('whatsapp_link_shortener_share','Compartilhamento do link curto','Permite compartilhar o link curto via Web Share.',false,'public'),
  ('whatsapp_link_shortener_history','Histórico do link curto','Reservada para histórico futuro.',false,'public')
on conflict (key) do nothing;

insert into public.app_settings (key,value,value_type,category,label,description,is_public,validation_schema) values
  ('whatsapp_link_shortener.anonymous_daily_limit','3','number','product','Limite diário anônimo do encurtador','Limite local preparado para criação de links curtos sem conta.',false,'{"min":0,"max":1000}'),
  ('whatsapp_link_shortener.free_daily_limit','10','number','product','Limite diário gratuito do encurtador','Limite local preparado para usuários gratuitos.',false,'{"min":0,"max":10000}'),
  ('whatsapp_link_shortener.premium_daily_limit','100','number','product','Limite diário premium do encurtador','Limite local preparado para usuários premium.',false,'{"min":0,"max":100000}'),
  ('whatsapp_link_shortener.admin_daily_limit','1000','number','product','Limite diário administrativo do encurtador','Limite local para testes e uso administrativo.',false,'{"min":0,"max":100000}'),
  ('whatsapp_link_shortener.fallback_enabled','true','boolean','product','Fallback para link oficial','Preserva o link oficial quando o encurtador falha.',false,'{}')
on conflict (key) do nothing;

create table if not exists public.whatsapp_shortener_events (
  id uuid primary key default gen_random_uuid(),
  request_id text not null check (char_length(request_id) between 8 and 100),
  access_level text not null check (access_level in ('anonymous','public','free','premium','admin')),
  user_id uuid null,
  status text not null check (status in ('succeeded','failed','rate_limited')),
  http_status integer not null check (http_status between 100 and 599),
  duration_ms integer not null default 0 check (duration_ms >= 0),
  error_code text null,
  retry_count integer not null default 0 check (retry_count between 0 and 10),
  idempotent_replay boolean not null default false,
  environment text not null,
  endpoint text not null,
  created_at timestamptz not null default now()
);

create index if not exists whatsapp_shortener_events_created_at_idx on public.whatsapp_shortener_events (created_at desc);
create index if not exists whatsapp_shortener_events_status_idx on public.whatsapp_shortener_events (status, created_at desc);
alter table public.whatsapp_shortener_events enable row level security;
revoke all on public.whatsapp_shortener_events from anon, authenticated;

commit;
