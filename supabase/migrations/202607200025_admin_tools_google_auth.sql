begin;

insert into public.app_settings (key,value,value_type,category,label,description,is_public,is_editable,validation_schema) values
  ('auth.google_client_id','""'::jsonb,'string','product','Google OAuth Client ID','Identificador público do cliente Web usado pelo botão oficial e pelo Google One Tap.',true,true,'{"maxLength":255,"pattern":"^[0-9]+-[A-Za-z0-9_-]+\\.apps\\.googleusercontent\\.com$"}'::jsonb),
  ('auth.google_authorized_origins','[]'::jsonb,'json','product','Origens JavaScript autorizadas','Lista documental de origens cadastradas no Google Auth Platform. Não altera o Google automaticamente.',false,true,'{"type":"array","maxItems":20}'::jsonb)
on conflict (key) do nothing;

comment on column public.app_settings.value is 'Configurações operacionais em lista fechada; segredos OAuth não podem ser armazenados nesta tabela.';

commit;
