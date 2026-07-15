# Catálogo de recursos e descoberta

## Objetivo

O catálogo em `product_features` é a fonte operacional para disponibilidade, público, estado, visibilidade e limites dos novos recursos. As chaves aceitas também formam uma lista fechada no código; criar uma linha arbitrária no banco não cria uma funcionalidade.

## Ativação inicial

Somente os recursos determinísticos do resultado de perfil começam ativos: análise e frequência de hashtags e os três rankings independentes de Reels. Eles usam `posts_data` já armazenado e não realizam nova chamada à ScrapeCreators.

O resumo de áudio começa desligado. Descoberta por categoria, tendências e áudio de descoberta começam desligados, em beta e com indicação de acesso premium. Aplicar a migration não ativa esses recursos.

## Critérios de ranking

- Visualizações: `playCount`, com fallback para `viewCount`.
- Engajamento por visualização: `(likeCount + commentCount) / views * 100`.
- Desempenho proporcional: `views / followersCount * 100`.

Cada ranking exclui itens sem os campos necessários. Ausência não é convertida em zero. Os critérios são apresentados separadamente e não produzem um score híbrido.

## Descoberta e consumo externo

As rotas `/descobrir`, `/descobrir/[slug]` e `/reels-em-alta` leem apenas snapshots persistidos e ainda válidos. A navegação pública nunca inicia uma chamada ao provedor.

A integração atual da ScrapeCreators não possui endpoints aprovados de pesquisa por categoria ou tendências. Para tornar esses recursos funcionais, é necessário primeiro homologar o endpoint, o contrato, o custo, o cache, os limites e a retenção. Até isso ocorrer, os recursos devem permanecer desligados.

## Administração

`/admin/recursos` exige `features.manage`, atualmente restrita ao superadministrador. Alterações são validadas contra chaves e enums conhecidos e gravadas em `admin_audit_logs`.

Ativar um recurso que usa provedor ou liberar acesso premium completo exige digitar `ATIVAR`. Habilitar uma categoria também exige `ATIVAR`. Não é usado `window.confirm`.

## Interesse em recursos

O endpoint `/api/feature-interest` registra apenas a chave do recurso, uma sessão anônima e a origem. O registro é deduplicado por sessão e protegido pelo rate limit já usado pelos tokens de formulário. Não armazena IP, e-mail ou conteúdo do perfil.

## Passos manuais para publicação

1. Revisar a migration `202607150011_product_features_and_discovery.sql` em ambiente de preview.
2. Aplicar a migration no Supabase somente após aprovação.
3. Publicar a aplicação sem alterar variáveis ou habilitar recursos premium.
4. Conferir `/admin/recursos` e manter descoberta/tendências desligadas.
5. Validar uma análise pública já armazenada e confirmar que nenhum crédito adicional foi consumido.

Nenhum desses passos é executado automaticamente por esta implementação.
