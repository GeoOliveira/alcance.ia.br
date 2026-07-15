# Reels em alta

A rota `/recursos/reels-em-alta` apresenta uma lista periodicamente atualizada de Reels em destaque. Todo resultado exibido representa uma **amostra pública** obtida de snapshots válidos em `trending_discovery_results`; a abertura da página nunca inicia coleta no provedor.

## Dados exibidos

Cada item normalizado pode apresentar thumbnail, autor público, legenda resumida, visualizações, curtidas, comentários, data, áudio, categoria estimada, idioma, país quando disponível e link para a publicação original. Métricas públicas podem mudar depois do instante de coleta.

A normalização aceita aliases comuns dos campos de provedores. Itens sem URL HTTPS válida são descartados. URLs duplicadas conservam a ocorrência do snapshot mais recente. Categoria, idioma e país podem vir do item ou da categoria vinculada ao snapshot.

## Filtros e ordenação

Os filtros são período, categoria, idioma, país e quantidade mínima de visualizações. As ordenações são:

- visualizações públicas disponíveis;
- engajamento, calculado por `(curtidas + comentários) / visualizações`;
- desempenho proporcional, lido do snapshot ou calculado como `visualizações / seguidores` quando a base pública estiver disponível;
- data de publicação, da mais recente para a mais antiga.

O filtro, a ordenação e a paginação são processados no servidor. A página mostra até 12 cards por página e respeita o limite total configurado no painel.

## Estados

- `loading.tsx`: skeleton durante navegações e leituras;
- vazio: diferencia ausência de snapshots e filtros sem correspondência;
- `error.tsx`: recuperação por nova tentativa quando a leitura falha;
- Premium Preview: mantém a página visível sem expor a lista quando o acesso é Premium ou a visibilidade é `preview`.

Todos os estados informam que o conteúdo é uma amostra pública.

## Administração e feature flag

O recurso `resource_trending_reels` é cadastrado em `product_features` e aparece em `/admin/recursos`. O Super Administrador pode controlar:

- ativação (`enabled`);
- atualização automática (`metadata.automaticRefresh`);
- cache em minutos (`limits.cacheMinutes`);
- limite diário (`limits.dailyRequests`);
- quantidade máxima de resultados (`limits.maxItems`);
- acesso público ou Premium (`audience`);
- beta ou produção (`status`);
- visibilidade completa, preview ou oculta (`visibility`);
- indexação (`metadata.indexable`).

A flag `resource_trending_reels` é uma segunda trava de disponibilidade. Alterações no catálogo usam `updateProductFeatureAction`; alterações da flag usam `updateFeatureFlagAction`. Ambas registram o antes e o depois em `admin_audit_logs`.

## Cache e atualização

Configuração e resultados usam caches separados e tags `resource-trending-reels-config` e `resource-trending-reels-data`. Salvar o recurso no painel invalida as tags e revalida a página. `automaticRefresh` é apenas uma configuração operacional: a navegação pública não chama APIs externas.

## Publicação

1. Aplicar `supabase/migrations/202607150014_public_trending_reels_resource.sql`.
2. Confirmar a existência de snapshots `result_type = reels` com `expires_at` futuro.
3. Validar os controles em `/admin/recursos` e a flag `resource_trending_reels`.
4. Fazer o deploy e conferir loading, vazio, erro, Premium Preview, filtros, ordenações e paginação.
