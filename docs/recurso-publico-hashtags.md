# Recurso público de hashtags

A rota `/recursos/hashtags` é uma ferramenta pública independente da análise de perfis. Ela apresenta hashtags armazenadas nos snapshots válidos de `category_discovery_results`, com busca, categoria, período, tendência, popularidade e paginação.

## Fonte e cache

- A página lê somente resultados com `result_type = hashtags` e `expires_at` no futuro.
- A visita de um usuário não inicia coleta nem chama a ScrapeCreators.
- O snapshot mais recente de cada categoria pública e ativa é normalizado e armazenado no cache do Next.js.
- O tempo de cache e o limite máximo de hashtags são definidos em `/admin/recursos`.

## Controles administrativos

O recurso usa a chave `resource_hashtags` no catálogo e nas feature flags. O Super Administrador pode controlar ativação, visibilidade, público, estado beta, acesso gratuito ou premium, limite de itens, cache, atualização automática e indexação.

Quando a indexação é desativada, a rota recebe `noindex` e é removida do sitemap. A opção de atualização automática registra a política administrativa, mas a página pública continua sem executar consultas externas.

## Publicação

Antes de publicar, aplique a migration `202607150013_public_hashtag_resource.sql`, faça o deploy da aplicação e confirme que existem snapshots válidos de hashtags nas categorias públicas. Sem snapshots, a página mostra o estado vazio esperado.
