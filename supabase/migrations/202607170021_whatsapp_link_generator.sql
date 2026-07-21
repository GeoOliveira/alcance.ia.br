begin;

alter table public.page_seo_settings drop constraint if exists page_seo_settings_page_key_check;
alter table public.page_seo_settings add constraint page_seo_settings_page_key_check check (page_key in ('home','about','how_it_works','resources','contact','privacy_policy','terms','cookies_policy','data_deletion','hashtags','trending_reels','category_reels','branded_content','whatsapp_link_generator'));
alter table public.page_seo_settings drop constraint if exists page_seo_settings_route_check;
alter table public.page_seo_settings add constraint page_seo_settings_route_check check (route in ('/','/quem-somos','/como-funciona','/recursos','/contato','/politica-de-privacidade','/termos-de-uso','/politica-de-cookies','/exclusao-de-dados','/recursos/hashtags','/recursos/reels-em-alta','/recursos/reels-por-categoria','/recursos/conteudo-de-marca','/recursos/gerador-link-whatsapp'));

insert into public.page_seo_settings (page_key, route, meta_title, meta_description)
values ('whatsapp_link_generator','/recursos/gerador-link-whatsapp','Gerador de Link WhatsApp Curto Grátis | Alcance IA','Crie gratuitamente um link direto para seu WhatsApp com número brasileiro e mensagem personalizada. Copie e compartilhe em sites e redes sociais.')
on conflict (page_key) do nothing;

insert into public.product_features (key,name,description,feature_group,audience,status,visibility,enabled,requires_provider_call,provider,estimated_credit_cost,limits,metadata)
values ('whatsapp_link_generator','Gerador de Link WhatsApp Curto','Gera localmente o link oficial wa.me para um número brasileiro e uma mensagem opcional.','category','public','active','full',true,false,'internal',0,'{"maxItems":1,"dailyRequests":0,"userDailyRequests":0,"cacheMinutes":0}','{"category":"Ferramentas","indexable":true,"requiresAuthentication":false,"requiresPremium":false,"messageEnabled":true,"shareEnabled":true,"openLinkEnabled":true,"copyEnabled":true,"shortenerEnabled":false,"messageMaxCharacters":500,"unavailableMessage":"Esta ferramenta está temporariamente indisponível."}')
on conflict (key) do nothing;

insert into public.feature_flags (key,name,description,enabled,scope) values
  ('resource_whatsapp_link_generator','Gerador de Link WhatsApp','Disponibilidade principal da ferramenta pública.',true,'public'),
  ('whatsapp_link_custom_message','Mensagem no link WhatsApp','Permite incluir mensagem pré-preenchida.',true,'public'),
  ('whatsapp_link_copy','Copiar link WhatsApp','Permite copiar o link gerado.',true,'public'),
  ('whatsapp_link_open','Abrir link WhatsApp','Permite testar o link em nova aba.',true,'public'),
  ('whatsapp_link_share','Compartilhar link WhatsApp','Permite usar o compartilhamento nativo.',true,'public'),
  ('whatsapp_link_shortener','Encurtador de link WhatsApp','Reservada para o encurtador próprio futuro.',false,'public'),
  ('whatsapp_link_history','Histórico de links WhatsApp','Reservada para histórico futuro.',false,'public'),
  ('whatsapp_link_qr_code','QR Code de link WhatsApp','Reservada para QR Code futuro.',false,'public')
on conflict (key) do nothing;

alter table public.site_content drop constraint if exists site_content_section_check;
alter table public.site_content add constraint site_content_section_check check (section in ('home.hero','home.benefits','home.final_cta','home.trust','home.availability','home.privacy_card','whatsapp_generator'));

insert into public.site_content (section,content_key,content_value,content_type) values
  ('whatsapp_generator','hero_title','Crie seu link do WhatsApp em poucos segundos','short_text'),
  ('whatsapp_generator','hero_description','Informe seu número, adicione uma mensagem personalizada e gere um link direto para iniciar conversas no WhatsApp.','text'),
  ('whatsapp_generator','hero_notice','Seu número é utilizado somente para montar o link e não precisa ser armazenado.','text'),
  ('whatsapp_generator','how_it_works_title','Como criar seu link direto','short_text'),
  ('whatsapp_generator','benefits_title','Um caminho mais simples para iniciar conversas','short_text'),
  ('whatsapp_generator','use_cases_title','Use seu link onde seus clientes já estão','short_text'),
  ('whatsapp_generator','privacy_title','Seu número permanece sob seu controle','short_text'),
  ('whatsapp_generator','privacy_description','A ferramenta apenas monta o endereço oficial que abre uma conversa. Ela não solicita senha, acessa mensagens ou envia conteúdo automaticamente.','text'),
  ('whatsapp_generator','final_cta_title','Crie agora seu link do WhatsApp','short_text'),
  ('whatsapp_generator','final_cta_description','Facilite o contato com seus clientes usando um link direto e uma mensagem personalizada.','text'),
  ('whatsapp_generator','final_cta_button','Gerar meu link','short_text')
on conflict (section,content_key,locale) do nothing;

insert into public.app_settings (key,value,value_type,category,label,description,is_public,validation_schema)
values ('whatsapp_link.message_max_characters','500','number','product','Limite da mensagem do link WhatsApp','Máximo de caracteres aceito na mensagem pré-preenchida.',true,'{"min":1,"max":2000}')
on conflict (key) do nothing;

commit;
