begin;

update public.app_settings
set value = '["https://alcance.ia.br","http://localhost:3000"]'::jsonb,
    updated_at = now()
where key = 'auth.google_authorized_origins'
  and (value is null or value = '[]'::jsonb);

commit;
