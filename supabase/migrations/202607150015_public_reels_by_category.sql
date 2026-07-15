begin;

insert into public.product_features (key,name,description,feature_group,audience,status,visibility,enabled,requires_provider_call,provider,estimated_credit_cost,limits,metadata) values
  ('resource_reels_by_category','Reels por categoria — página pública','Exploração pública de Reels organizados pelas categorias e snapshots administrados.','category','public','active','full',true,false,'internal',0,'{"maxItems":60,"dailyRequests":0,"cacheMinutes":180}','{"automaticRefresh":false,"indexable":true,"enabledCountries":["BR"],"enabledLanguages":["pt-BR"]}')
on conflict (key) do nothing;

insert into public.feature_flags (key,name,description,enabled,scope) values
  ('resource_reels_by_category','Página pública de Reels por categoria','Controla a disponibilidade da ferramenta /recursos/reels-por-categoria.',true,'public')
on conflict (key) do nothing;

insert into public.content_categories (slug,name,description,keywords,seed_hashtags,language,country,enabled,visible,position) values
  ('marketing','Marketing','Estratégias, conteúdo e crescimento de marcas.',array['marketing','conteúdo','marca'],array['marketing','marketingdigital'],'pt-BR','BR',true,true,10),
  ('negocios','Negócios','Empreendedorismo, gestão, vendas e carreira.',array['negócios','empreendedorismo','vendas'],array['negocios','empreendedorismo'],'pt-BR','BR',true,true,20),
  ('tecnologia','Tecnologia','Tecnologia, produtos digitais e inovação.',array['tecnologia','software','inovação'],array['tecnologia','tech'],'pt-BR','BR',true,true,30),
  ('financas','Finanças','Educação financeira, investimentos e economia.',array['finanças','investimentos','economia'],array['financas','investimentos'],'pt-BR','BR',true,true,40),
  ('fitness','Fitness','Treinos, condicionamento e vida ativa.',array['fitness','treino','atividade física'],array['fitness','treino'],'pt-BR','BR',true,true,50),
  ('saude','Saúde','Saúde, prevenção, hábitos e bem-estar.',array['saúde','bem-estar','hábitos'],array['saude','bemestar'],'pt-BR','BR',true,true,60),
  ('gastronomia','Gastronomia','Receitas, restaurantes e experiências gastronômicas.',array['gastronomia','receitas','comida'],array['gastronomia','receitas'],'pt-BR','BR',true,true,70),
  ('moda','Moda','Moda, estilo e tendências de vestuário.',array['moda','estilo','look'],array['moda','lookdodia'],'pt-BR','BR',true,true,80),
  ('beleza','Beleza','Beleza, maquiagem e cuidados pessoais.',array['beleza','maquiagem','skincare'],array['beleza','skincare'],'pt-BR','BR',true,true,90),
  ('educacao','Educação','Conteúdos educacionais, aulas e aprendizagem.',array['educação','estudos','aprendizagem'],array['educacao','estudos'],'pt-BR','BR',true,true,100),
  ('pets','Pets','Cuidados, comportamento e rotina de animais.',array['pets','animais','cuidados'],array['pets','cachorros','gatos'],'pt-BR','BR',true,true,110),
  ('musica','Música','Música, artistas, instrumentos e produção.',array['música','artistas','produção musical'],array['musica','musicabrasileira'],'pt-BR','BR',true,true,120),
  ('turismo','Turismo','Destinos, roteiros e experiências de viagem.',array['turismo','viagens','roteiro'],array['turismo','viagem'],'pt-BR','BR',true,true,130),
  ('entretenimento','Entretenimento','Humor, cultura pop e diversão.',array['entretenimento','humor','cultura pop'],array['entretenimento','humor'],'pt-BR','BR',true,true,140)
on conflict (slug) do update set name=excluded.name, description=excluded.description, keywords=excluded.keywords, seed_hashtags=excluded.seed_hashtags, position=excluded.position;

commit;
