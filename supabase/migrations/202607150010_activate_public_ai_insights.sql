begin;

update public.app_settings
set value = 'true'::jsonb, updated_at = now()
where key = 'ai.enabled';

update public.app_settings
set value = '"full"'::jsonb, updated_at = now()
where key = 'ai.public_visibility';

update public.feature_flags
set enabled = true, updated_at = now()
where key = 'ai_profile_analysis';

commit;
