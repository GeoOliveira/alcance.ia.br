begin;

insert into public.product_features (key,name,description,feature_group,audience,status,visibility,enabled,requires_provider_call,provider,estimated_credit_cost,limits,metadata) values
  ('resource_hashtags','Descoberta pública de hashtags','Ferramenta pública baseada exclusivamente em snapshots válidos de hashtags por categoria.','category','public','active','full',true,false,'internal',0,'{"maxItems":60,"dailyRequests":0,"cacheMinutes":360}','{"automaticRefresh":false,"indexable":true}')
on conflict (key) do nothing;

insert into public.feature_flags (key,name,description,enabled,scope) values
  ('resource_hashtags','Página pública de hashtags','Controla a disponibilidade da ferramenta pública /recursos/hashtags.',true,'public')
on conflict (key) do nothing;

comment on column public.product_features.metadata is 'Configurações não secretas, incluindo atualização automática e indexação de ferramentas públicas.';

commit;
