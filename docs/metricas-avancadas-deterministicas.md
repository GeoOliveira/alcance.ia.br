# Métricas avançadas determinísticas

## Objetivo e arquitetura

A versão `v2.0.0` amplia a análise usando somente perfil e publicações normalizados já coletados. O fluxo permanece: fornecedor → contratos normalizados → métricas puras → regras → view model → interface. Componentes não calculam indicadores e nunca recebem a resposta bruta do fornecedor.

O orquestrador é `src/lib/analysis/metrics/calculate.ts`. Cada módulo retorna `available`, `explanationCode` e `confidence`, preservando `null` quando um dado não existe. O tempo total é registrado em milissegundos na metodologia, sem bio, legendas, username, hashtags ou JSON em logs analíticos.

## Fórmulas e classificações

| Módulo | Fórmula ou regra | Classificação / amostra |
|---|---|---|
| Completude | soma fixa: foto 15, nome 10, bio 20, link 15, categoria 10, posts 15, informação adicional 15 | 0–39 incompleto; 40–64 básico; 65–84 bem preenchido; 85–100 completo |
| Seguidores/seguindo | `followersCount / followingCount` | apenas descritivo; ausente ou divisor zero fica indisponível |
| Diversidade | contagem e percentual por Reel, imagem, carrossel e desconhecido | menos de 3 posts: insuficiente; 1 formato: concentrado; 2: moderado; 3+: diverso |
| Desempenho por formato | médias e medianas de curtidas/comentários; views somente para Reels; engajamento = média de interações / seguidores | mínimo configurável, padrão 3 por formato |
| Estabilidade | CV = desvio-padrão populacional / média; média/mediana; amplitude; outlier acima de média + 2 desvios | mínimo 4; CV < 0,35 estável; < 0,75 moderado; demais muito variável |
| Concentração | participação do top 1, top 3 e `ceil(20%)` em `curtidas + comentários` | mínimo 3 e total positivo; top 3 ≥ 70% alta, ≥ 50% parcial, demais distribuída |
| Tendência | dois grupos cronológicos de mesmo tamanho; variação = `(recente - anterior) / abs(anterior)` | padrão 6 posts; < 10% estável; 10–24,99% moderada; ≥ 25% relevante |
| Regularidade | contagens 7/30/90, média semanal, intervalos, semanas ativas e inativas na janela observada | mínimo 3 para classificar; não prescreve frequência universal |
| Legendas | comprimento médio/mediano, vazias, parágrafos, perguntas, emojis, menções, hashtags, curtas e longas | descritivo; curta < 80 e longa > 220 somente para comprimento típico |
| CTA | padrões explícitos em português, agrupados por interação, compartilhamento, salvamento, clique, contato e acompanhamento | não usa correspondências sem objeto quando isso criaria falso positivo |
| Hashtags | listas normalizadas, média, mediana, únicas, repetidas, top 3 / total de usos | comparação com/sem hashtag só quando cada grupo atinge a amostra configurada |
| Destaques | nenhum cálculo enquanto o contrato não possuir destaques | `highlights_not_collected`; não dispara nova coleta |

Views de Reels nunca são somadas às interações. Ausência não vira zero. A tendência descreve publicações observadas e não é apresentada como crescimento do perfil.

## Confiança

Os módulos usam quatro níveis: indisponível quando faltam campos essenciais, baixa abaixo da amostra mínima, média a partir do mínimo e alta em amostras maiores. O resultado inclui tamanho e motivo. A metodologia exibe isso discretamente; classificações são suprimidas ou marcadas como insuficientes quando a amostra não sustenta a leitura.

## Configuração e flags

Limites numéricos são carregados no servidor, validados por uma lista fechada e possuem defaults seguros. Legendas, CTA, hashtags e destaques exigem simultaneamente setting booleano e feature flag. Falha de leitura desabilita todos os módulos. Consulte `docs/configuracoes-e-feature-flags-analise.md`.

## Versionamento, persistência e recálculo

A migration local `202607150006_advanced_analysis_metrics.sql` acrescenta a `analysis_results`: `metrics_version`, `calculated_metrics` JSONB limitado a 256 KiB, status, início, conclusão e erro sanitizado. O JSON contém versão, data, amostra, Reels considerados, janela, campos ausentes, módulos ativos e resultados.

`recalculateAnalysisMetrics(analysisId)` lê `profile_data` e `posts_data`, valida a existência dos dados, recalcula e atualiza o resultado. Não importa cliente do fornecedor, não usa `fetch` e registra auditoria administrativa com `external_calls: 0`. Análises antigas continuam abrindo: quando o JSON versionado não existe, a leitura pode recalcular em memória a partir dos dados normalizados, respeitando as flags, sem persistir e sem nova chamada externa.

## Limitações

- A amostra é limitada às publicações coletadas, não ao histórico integral da conta.
- Métricas públicas não substituem Instagram Insights.
- CTA usa padrões lexicais, não compreensão semântica.
- Relações entre hashtag e interações são descritivas, não causais.
- Destaques permanecem indisponíveis até existir coleta autorizada, limitada, cacheada e contabilizada.
- Não há IA generativa, comentários, transcrição, concorrentes, sentimento ou análise de imagem.
