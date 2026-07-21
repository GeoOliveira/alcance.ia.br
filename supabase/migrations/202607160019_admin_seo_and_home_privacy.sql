-- SEO administrável e conteúdo do card de transparência da Home.
create table if not exists public.page_seo_settings (
  id uuid primary key default gen_random_uuid(),
  page_key text not null unique check (page_key in ('home','about','how_it_works','resources','contact','privacy_policy','terms','cookies_policy','data_deletion','hashtags','trending_reels','category_reels','branded_content')),
  route text not null unique check (route in ('/','/quem-somos','/como-funciona','/recursos','/contato','/politica-de-privacidade','/termos-de-uso','/politica-de-cookies','/exclusao-de-dados','/recursos/hashtags','/recursos/reels-em-alta','/recursos/reels-por-categoria','/recursos/conteudo-de-marca')),
  meta_title text check (meta_title is null or char_length(meta_title) between 1 and 70),
  meta_description text check (meta_description is null or char_length(meta_description) between 1 and 180),
  meta_keywords text[] not null default '{}' check (cardinality(meta_keywords) <= 20),
  og_title text check (og_title is null or char_length(og_title) <= 90),
  og_description text check (og_description is null or char_length(og_description) <= 220),
  og_image_url text check (og_image_url is null or (char_length(og_image_url) <= 2048 and og_image_url ~ '^https://')),
  canonical_url text check (canonical_url is null or (char_length(canonical_url) <= 2048 and canonical_url ~ '^https://')),
  indexable boolean not null default true,
  follow_links boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

create index if not exists page_seo_settings_updated_at_idx on public.page_seo_settings (updated_at desc);
drop trigger if exists set_page_seo_settings_updated_at on public.page_seo_settings;
create trigger set_page_seo_settings_updated_at before update on public.page_seo_settings
for each row execute function public.set_updated_at();

alter table public.page_seo_settings enable row level security;
revoke all on public.page_seo_settings from public, anon, authenticated;
grant select, insert, update on public.page_seo_settings to authenticated;

drop policy if exists page_seo_settings_select on public.page_seo_settings;
create policy page_seo_settings_select on public.page_seo_settings for select to authenticated using (public.is_admin());
drop policy if exists page_seo_settings_insert on public.page_seo_settings;
create policy page_seo_settings_insert on public.page_seo_settings for insert to authenticated
with check (public.has_admin_role(array['super_admin','admin','editor']));
drop policy if exists page_seo_settings_update on public.page_seo_settings;
create policy page_seo_settings_update on public.page_seo_settings for update to authenticated
using (public.has_admin_role(array['super_admin','admin','editor']))
with check (public.has_admin_role(array['super_admin','admin','editor']));

insert into public.page_seo_settings (page_key, route) values
  ('home','/'), ('about','/quem-somos'), ('how_it_works','/como-funciona'), ('resources','/recursos'), ('contact','/contato'),
  ('privacy_policy','/politica-de-privacidade'), ('terms','/termos-de-uso'), ('cookies_policy','/politica-de-cookies'), ('data_deletion','/exclusao-de-dados'),
  ('hashtags','/recursos/hashtags'), ('trending_reels','/recursos/reels-em-alta'), ('category_reels','/recursos/reels-por-categoria'), ('branded_content','/recursos/conteudo-de-marca')
on conflict do nothing;

alter table public.site_content drop constraint if exists site_content_section_check;
alter table public.site_content add constraint site_content_section_check
check (section in ('home.hero','home.benefits','home.final_cta','home.trust','home.availability','home.privacy_card'));

insert into public.site_content (section, content_key, content_value, content_type) values
  ('home.privacy_card','title','Análise transparente','short_text'),
  ('home.privacy_card','description','As métricas são calculadas com base em dados públicos e regras verificáveis.','text'),
  ('home.privacy_card','item_1','Dados públicos','short_text'),
  ('home.privacy_card','item_2','Sem senha','short_text'),
  ('home.privacy_card','item_3','Métricas explicadas','short_text')
on conflict (section, content_key, locale) do nothing;

comment on table public.page_seo_settings is 'SEO de catálogo fechado, com fallback no código e sem scripts ou rotas arbitrárias.';
