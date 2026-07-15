# Dicionário de métricas

## Engajamento médio estimado

| Campo | Definição |
|---|---|
| Nome interno | `estimatedEngagementRate` |
| Rótulo público | Engajamento médio estimado |
| Fórmula | `média(posts válidos.map(curtidas + comentários)) / seguidores × 100` |
| Unidade | porcentagem |
| Campos | `likeCount`, `commentCount`, `publishedAt`, `followersCount` |
| Seleção | até 20 publicações, ordenadas pela data real, com no máximo 90 dias |
| Amostra mínima | 3 posts válidos para classificação |
| Fallback | `null` quando seguidores não são positivos ou não há interação completa; classificação “Dados insuficientes” abaixo da amostra mínima |
| Versão | `engagement-v2` |
| Interpretação | média de interações públicas por publicação em relação aos seguidores atuais |
| Limitações | não inclui salvamentos, compartilhamentos, alcance ou interações privadas; seguidores são o valor atual, não o valor na data do post |

Post válido é aquele com data dentro da janela e curtidas e comentários numericamente observados. Zero real é válido. Ausência não é imputada como zero. Views e plays de Reels não entram nesta taxa.

Classificação universal e configurada no código: abaixo de 1% baixo; de 1% até abaixo de 3% moderado; de 3% até abaixo de 6% bom; 6% ou mais alto. A classificação usa o valor bruto.

## Engajamento típico estimado

| Campo | Definição |
|---|---|
| Nome interno | `estimatedTypicalEngagementRate` |
| Rótulo público | Engajamento típico estimado |
| Fórmula | `mediana(posts válidos.map(curtidas + comentários)) / seguidores × 100` |
| Unidade | porcentagem |
| Campos e seleção | os mesmos do engajamento médio |
| Amostra mínima | a interface informa confiança; a métrica pode ser calculada com um post, mas não recebe classificação forte |
| Fallback | `null` sem seguidores positivos ou sem posts válidos |
| Versão | `engagement-v2` |
| Interpretação | desempenho central menos sensível a um post viral ou excepcionalmente fraco |
| Limitações | as mesmas da taxa média; não equivale a `mediana(curtidas) + mediana(comentários)` |

## Confiança do engajamento

| Posts válidos | Valor interno | Leitura |
|---:|---|---|
| 0–2 | `insufficient` | dados insuficientes; sem classificação |
| 3–5 | `low` | baixa confiança |
| 6–11 | `medium` | confiança média |
| 12 ou mais | `high` | confiança alta |

## Views de Reels

`averageReelViews` é uma métrica descritiva separada, calculada somente a partir de `playCount` ou `viewCount` numericamente disponíveis em vídeos. Ela não é somada às interações e não altera classificação, média ou mediana de engajamento.
