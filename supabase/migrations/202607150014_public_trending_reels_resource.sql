begin;

insert into public.product_features (key,name,description,feature_group,audience,status,visibility,enabled,requires_provider_call,provider,estimated_credit_cost,limits,metadata) values
  ('resource_trending_reels','Reels em alta — página pública','Lista periodicamente atualizada baseada exclusivamente em uma amostra pública persistida.','trending','public','active','full',true,false,'internal',0,'{"maxItems":48,"dailyRequests":0,"cacheMinutes":180}','{"automaticRefresh":false,"indexable":true}')
on conflict (key) do nothing;

insert into public.feature_flags (key,name,description,enabled,scope) values
  ('resource_trending_reels','Página pública de Reels em alta','Controla a disponibilidade da amostra pública em /recursos/reels-em-alta.',true,'public')
on conflict (key) do nothing;

comment on table public.trending_discovery_results is 'Snapshots persistidos de uma amostra pública de tendências; a leitura pública nunca dispara coleta externa.';

commit;
