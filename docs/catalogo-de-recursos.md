# Catálogo de recursos

O catálogo combina uma lista fechada em `src/lib/product-features/catalog.ts` com controles persistidos em `product_features`. Cada item define grupo, estado (`development`, `beta`, `active` ou `disabled`), acesso (`public`, `free`, `premium` ou `admin`), visibilidade, provedor, custo estimado, dependências e limites.

Recursos determinísticos do perfil começam públicos. Áudio, descoberta e tendências começam desligados. Detalhes operacionais estão em [catalogo-de-recursos-e-descoberta.md](catalogo-de-recursos-e-descoberta.md).
# Pesquisa de Conteúdo de Marca

O catálogo fechado inclui `branded_content_search` no grupo `research`, com resolução interna entre `meta_official` e `apify`. O seed é administrativo, oculto, em desenvolvimento, desativado e usa `meta_only`. A escolha técnica do provedor é independente do acesso público, Free ou Premium. Limites incluem teto global, cache por provedor e máximo de itens; a chave não pode ser criada arbitrariamente pelo painel.
