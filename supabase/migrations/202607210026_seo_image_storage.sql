insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('seo-images', 'seo-images', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists seo_images_admin_insert on storage.objects;
create policy seo_images_admin_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'seo-images' and public.has_admin_role(array['super_admin','admin','editor']));

drop policy if exists seo_images_admin_delete on storage.objects;
create policy seo_images_admin_delete on storage.objects for delete to authenticated
  using (bucket_id = 'seo-images' and public.has_admin_role(array['super_admin','admin','editor']));

comment on column public.page_seo_settings.og_image_url is 'Imagem pública de compartilhamento Open Graph e Twitter; upload administrativo no bucket seo-images ou URL HTTPS.';
