begin;

update public.feature_flags
set enabled = true, updated_at = now()
where key in (
  'profile_completeness_analysis',
  'content_format_analysis',
  'engagement_stability_analysis',
  'recent_trend_analysis',
  'caption_analysis',
  'cta_analysis',
  'hashtag_analysis',
  'highlights_audit',
  'deterministic_action_plan'
);

update public.app_settings
set value = 'true'::jsonb, updated_at = now()
where key in (
  'analysis.caption_analysis_enabled',
  'analysis.hashtag_analysis_enabled',
  'analysis.cta_analysis_enabled',
  'analysis.highlights_audit_enabled'
);

update public.feature_flags
set enabled = true, updated_at = now()
where key in (
  'ai_profile_summary',
  'ai_bio_analysis',
  'ai_recommendations',
  'ai_content_ideas',
  'ai_action_plan_explanation'
);

-- O controle mestre da IA permanece desligado até a configuração deliberada
-- de ambiente, app_settings e visibilidade pública.
update public.feature_flags
set enabled = false, updated_at = now()
where key = 'ai_profile_analysis';

commit;
