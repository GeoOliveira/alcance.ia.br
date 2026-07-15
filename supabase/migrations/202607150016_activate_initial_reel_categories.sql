begin;

update public.content_categories
set enabled = true,
    visible = true,
    language = 'pt-BR',
    country = 'BR'
where slug in (
  'marketing','negocios','tecnologia','financas','fitness','saude','gastronomia',
  'moda','beleza','educacao','pets','musica','turismo','entretenimento'
);

commit;
