# Reels por categoria

## Escopo

A ferramenta pública está disponível em `/recursos/reels-por-categoria` e permite explorar uma amostra pública de Reels por categoria. As páginas canônicas de categorias ativas usam `/recursos/reels-por-categoria/[slug]`.

Os resultados são baseados em uma amostra pública de conteúdos encontrados. Eles não representam todos os conteúdos do Instagram. Essa ressalva deve permanecer visível na interface e nunca pode ser substituída por alegações de cobertura total.

## Fonte de dados

A página reutiliza `content_categories` como fonte única da taxonomia e lê apenas snapshots válidos de `category_discovery_results` com `result_type = 'reels'`. A navegação pública nunca inicia uma consulta ao provedor externo. Snapshots expirados, categorias inativas ou categorias ocultas não são exibidos.

Os campos reconhecidos incluem thumbnail, título ou legenda, autor, visualizações, curtidas, comentários, data, áudio, hashtags, formato, país e idioma. A taxa de engajamento é `(curtidas + comentários) / visualizações`. O desempenho proporcional usa o valor fornecido no snapshot ou, quando disponível, `visualizações / seguidores`.

## Pesquisa, filtros e ordenação

A busca considera legenda, autor, categoria, áudio e hashtags. Os filtros disponíveis são categoria, período, idioma, país, mínimo de visualizações e formato. As ordenações são mais visualizados, mais engajados, melhor desempenho proporcional e mais recentes. A paginação pública usa 12 cards por página e respeita o limite administrativo.

## Administração

O recurso `resource_reels_by_category` é controlado em `/admin/recursos`. O Super Administrador pode definir:

- disponibilidade e Feature Flag;
- acesso público, gratuito, premium ou administrativo;
- visibilidade, cache e atualização automática;
- quantidade máxima de resultados;
- países e idiomas habilitados;
- permissão de indexação.

As categorias são editadas em `/admin/categorias` e também permanecem visíveis no catálogo de `/admin/recursos`. Nome, slug, descrição, palavras-chave, hashtags-semente, termos excluídos, ordem, estado ativo, visibilidade, idioma, país e intervalo de atualização são auditados pelas Server Actions existentes.

Ativar `automaticRefresh` configura o processo operacional, mas não agenda nem executa coleta por si só. A coleta deve ser realizada por um job autorizado que publique snapshots válidos e registre consumo externo.

## SEO e sitemap

A página principal só é indexável quando o recurso, a flag e a configuração de indexação estão ativos. O sitemap inclui exclusivamente as URLs das categorias que estejam simultaneamente ativas, visíveis e permitidas pelos países e idiomas configurados no recurso. Ao alterar categorias ou configurações, as páginas, dados e caches relacionados são revalidados.

## Migration

`202607150015_public_reels_by_category.sql` cria o recurso, a flag e as 14 categorias iniciais: Marketing, Negócios, Tecnologia, Finanças, Fitness, Saúde, Gastronomia, Moda, Beleza, Educação, Pets, Música, Turismo e Entretenimento. A migration incremental `202607150016_activate_initial_reel_categories.sql` garante o mesmo estado ativo e público quando algum desses slugs já existia antes do seed.
