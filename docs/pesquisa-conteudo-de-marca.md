# Pesquisa de Conteúdo de Marca

`/recursos/conteudo-de-marca` chama `GET /api/branded-content/search`. A rota valida catálogo, flags, sessão/plano, limites e parâmetros antes de usar `src/lib/meta`; componentes nunca chamam a Graph API.

Endpoint externo: `GET https://graph.facebook.com/{META_GRAPH_API_VERSION}/branded_content_search`, com datas, `fields`, cursor opcional e exatamente um identificador. Campos solicitados: `type,creation_date,creator,partners,url`.

O catálogo tipado usa `branded_content_search`, grupo “Pesquisa e inteligência”, inicialmente `development`, `admin`, oculto e inativo. O superadministrador controla acesso, visibilidade, limites, cache, máximo, paginação, IA, histórico, exportação, indexação, beta e mensagem. `/admin/recursos/branded_content_search` mostra diagnóstico/telemetria sem token.

Todas as flags `resource_branded_content*` começam desligadas. IA, histórico e exportação não estão implementados. Cache em memória usa plataforma, identificador, datas e cursor, com TTL do catálogo e sem token. Na Vercel ele é por instância; Redis não foi adicionado. Limites globais e por ator/plano usam `branded_content_search_runs`.

Analytics permite somente plataforma, preset, contagem, cache, status e acesso. Username, URL de Página, nomes, cursor e token são proibidos. Metadata, canonical, OG, breadcrumbs, FAQ e metodologia foram adicionados; sitemap e indexação dependem da configuração ativa.

## Teste manual

1. aplicar localmente `202607150017_branded_content_search.sql`;
2. configurar as quatro variáveis `META_*` no ambiente de teste;
3. manter acesso administrativo e flags auxiliares desligadas;
4. ativar catálogo e flag mestre com confirmação;
5. testar Instagram/Facebook no diagnóstico e sanitizar a resposta;
6. confirmar permissões, tipo de token, campos, erros, limites, cursor, cache e ausência de credencial no navegador/logs;
7. somente depois considerar beta, paginação e público.

Não aplicar migration remota, alterar produção ou fazer deploy automaticamente.
