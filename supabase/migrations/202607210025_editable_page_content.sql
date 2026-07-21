alter table public.site_content drop constraint if exists site_content_section_check;
alter table public.site_content add constraint site_content_section_check
  check (section in ('home.hero','home.benefits','home.final_cta','home.trust','home.availability','home.privacy_card','whatsapp_generator') or section ~ '^page_[a-z][a-z0-9_]*$');

alter table public.site_content drop constraint if exists site_content_content_value_check;
alter table public.site_content add constraint site_content_content_value_check
  check (char_length(content_value) between 1 and 20000 and content_value !~* '<\s*(script|iframe|object|embed|style)');

grant insert on public.site_content to authenticated;
drop policy if exists site_content_insert on public.site_content;
create policy site_content_insert on public.site_content for insert to authenticated
  with check (public.is_admin() and updated_by = (select auth.uid()));

comment on table public.site_content is 'Conteúdo público administrável de catálogo fechado, sem HTML arbitrário.';
