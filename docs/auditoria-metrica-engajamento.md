# Auditoria da métrica de engajamento

Data da auditoria: 14 de julho de 2026. Escopo: cálculo determinístico, coleta normalizada já existente, persistência, recálculo administrativo e página pública. Nenhuma API externa foi consultada, nenhuma integração de IA foi alterada, nenhuma migration remota foi aplicada e nenhum deploy foi realizado.

## Resumo executivo

Antes da auditoria, a taxa executada era:

```text
média((curtidas ?? 0) + (comentários ?? 0)) / seguidores × 100
```

Ela era matematicamente uma média por publicação, não uma soma total sem divisor. Contudo, um post com somente um dos campos conhecido entrava na amostra e o campo ausente virava zero sem registro. Todos os conteúdos retornados pela primeira página dos endpoints de posts e Reels entravam, sem janela temporal ou limite explícito no cálculo. A deduplicação escolhia apenas o primeiro identificador disponível, não normalizava permalinks e não mesclava campos complementares.

Depois da auditoria, `engagement-v2` calcula duas métricas:

```text
engajamento médio estimado = média(curtidas + comentários por post válido) / seguidores × 100
engajamento típico estimado = mediana(curtidas + comentários por post válido) / seguidores × 100
```

Um post é válido para engajamento somente quando possui data válida dentro da janela e tanto curtidas quanto comentários observados. Zero real é aceito. A classificação usa o valor bruto da média; arredondamento ocorre apenas nos formatadores da interface.

## Antes da auditoria

- Função principal: `calculateAnalysisMetrics`, em `src/lib/analysis/analysis-metrics.ts`.
- Fórmula: média das interações por post dividida por seguidores, em porcentagem.
- Interação parcial: `(likeCount ?? 0) + (commentCount ?? 0)` quando ao menos um campo existia.
- Medianas: curtidas e comentários eram calculados separadamente, mas nenhuma mediana de interações alimentava a taxa principal.
- Seleção: todos os itens deduplicados retornados por uma página de posts e uma página de Reels.
- Deduplicação: `providerPostId || shortcode || permalink`, comparação literal e sem fusão de dados.
- Classificação universal: abaixo de 1% `Baixo`; de 1% até abaixo de 3% `Moderado`; de 3% até abaixo de 6% `Bom`; 6% ou mais `Alto`.
- Amostra mínima: inexistente para classificação; um único post podia receber `Alto`.
- Versão: a métrica básica não registrava versão própria. `metrics_version` pertencia aos módulos avançados.
- Interface: exibia apenas “Engajamento estimado”, sem dizer média, amostra ou confiança.

## Depois da auditoria

- Fórmula versionada: `ENGAGEMENT_FORMULA_VERSION = "engagement-v2"`.
- Média e mediana são calculadas sobre a mesma lista `posts.map(likes + comments)` de posts completos.
- Padrão configurável: até 20 posts, no máximo 90 dias, mínimo de 3 posts válidos.
- Confiança: menos de 3 `insufficient`; 3–5 `low`; 6–11 `medium`; 12 ou mais `high`.
- Classificação: não é apresentada abaixo da amostra mínima. Os limites universais anteriores foram preservados e centralizados, pois não havia base de produto validada para criar segmentação por porte.
- Persistência inclui versão, instante, seguidores usados, tamanho e exclusões da amostra, janela, média, mediana e diagnóstico de outliers dentro do JSON `metrics`; colunas dedicadas identificam versão e data.
- Recálculo preserva até dez snapshots anteriores em `metrics_history` e não faz chamadas externas.
- A interface diferencia “Engajamento médio estimado” de “Engajamento típico estimado” e apresenta amostra, confiança, fórmula e metodologia.

## Fluxo completo

| Etapa | Arquivo e função | Entrada | Saída | Perdas, fallback e erro |
|---|---|---|---|---|
| Fornecedor | `scrape-creators/provider.ts`, `fetchFromScrapeCreators` | handle e endpoint | páginas validadas e normalizadas | primeira página por endpoint no fluxo público; falha parcial de posts ou Reels é tolerada |
| Normalização | `scrape-creators/mapper.ts`, `mapProfile` / `mapPost` | JSON tolerante | `InstagramProfile` / `InstagramPost` | tipo inesperado vira `null`, não zero; data inválida vira `null` |
| Deduplicação | `analysis/deduplicate-posts.ts`, `deduplicatePosts` | posts + Reels | posts únicos e contadores | usa ID, shortcode e permalink normalizado; mescla campos conhecidos; item sem qualquer identidade é descartado e contado |
| Seleção | `analysis/engagement.ts`, `selectEngagementPosts` | posts únicos, data e configuração | janela ordenada e posts válidos | exclui data ausente, fora da janela, excesso do limite, curtidas ausentes e comentários ausentes com contadores separados |
| Interações | `analysis-metrics.ts`, `calculateAnalysisMetrics` | posts válidos | `likeCount + commentCount` por post | ambos os campos precisam ser observados; zero é válido |
| Taxas | mesma função | interações e seguidores | média e mediana em porcentagem | seguidores ausentes ou menores/iguais a zero produzem `null` |
| Classificação | `analysis/engagement.ts`, `classifyEngagement` | média bruta e amostra | rótulo | menos de 3 posts retorna dados insuficientes; não arredonda antes |
| Persistência | `analysis/process-analysis.ts` | métricas e metadados | `analysis_results` | falha de escrita interrompe conclusão; respostas brutas não são registradas |
| View model | `analysis/analysis-view-model.ts`, `normalizeMetrics` | linha persistida | `AnalysisViewModel` | resultados antigos recebem adaptação `legacy-v1`, sem reescrita silenciosa |
| Exibição | `analysis-hero-summary.tsx`, `analysis-metrics-grid.tsx`, `analysis-methodology.tsx` | view model | porcentagens formatadas | não recalcula no cliente; valores nulos usam texto de indisponibilidade |

## Seleção, formatos e posts fixados

Posts e Reels são combinados e deduplicados antes do cálculo. IDs do fornecedor, shortcodes e permalinks normalizados são aliases da mesma publicação. Quando uma cópia traz comentários e outra traz visualizações, os campos conhecidos são mesclados. Carrosséis entram como uma publicação. Reels entram na taxa somente por curtidas e comentários; views e plays continuam em métricas separadas.

A seleção ordena por `publishedAt` decrescente, aplica 90 dias e depois limita aos 20 mais recentes. Publicações sem data não entram porque não é possível provar que pertencem à janela. `isPinned` é preservado, mas não muda a regra: um fixado recente entra e um fixado antigo sai pela data real. Não há exclusão silenciosa de outliers.

## Ausências e qualidade da amostra

O mapper só aceita números finitos. `null`, `undefined`, string vazia, `"0"` e tipos inesperados não se tornam zero; o fornecedor precisa retornar número `0` para que o valor seja observado como zero. As médias independentes de curtidas e comentários continuam ignorando ausências para fins descritivos. A taxa, porém, requer os dois campos no mesmo post, impedindo denominadores diferentes e imputação silenciosa.

`engagementExclusions` registra `missing_date`, `outside_time_window`, `over_post_limit`, `missing_likes` e `missing_comments`. Um post com ambos os campos ausentes aparece nos dois últimos contadores; `validEngagementPosts` é a quantidade efetivamente usada.

## Outliers

O resultado persiste média, mediana, mínimo, máximo, relação média/mediana, participação do melhor post e participação dos três melhores. Nenhum valor é excluído por desempenho. A mediana de interações totais, e não a soma de medianas independentes, forma o engajamento típico.

## Classificação e segmentação

Os limites centralizados são `1%`, `3%` e `6%`, com bordas inclusivas na faixa superior: exatamente 1% é moderado, 3% é bom e 6% é alto. O mesmo conjunto vale para todos os portes. Essa ausência de segmentação é explícita; criar faixas por seguidores sem evidência validada alteraria o significado histórico e foi deixado como decisão de produto futura.

## Persistência, versão e compatibilidade

A migration `202607150007_engagement_metric_audit.sql` acrescenta `engagement_formula_version`, `engagement_calculated_at` e `metrics_history`, além das três configurações internas. `metrics_version` permanece reservado aos módulos avançados. Novas análises gravam `engagement-v2`. Leituras sem versão são adaptadas como `legacy-v1` e continuam exibindo o valor persistido; não há recálculo automático nem sobrescrita.

O recálculo administrativo existente exige `analysis.manage`, usa somente `profile_data` e `posts_data`, audita solicitação e resultado, informa `external_calls: 0` e preserva o snapshot anterior. A migration deve ser revisada e aplicada manualmente antes de ativar esse caminho em ambiente remoto.

## Problemas encontrados e correções

1. Ausência parcial convertida silenciosamente em zero — corrigida por validação conjunta.
2. Um post recebia classificação forte — corrigido pela amostra mínima.
3. Mediana principal inexistente — adicionada sobre interações totais.
4. Sem janela ou limite explícito — adicionados parâmetros tipados e configuráveis.
5. Deduplicação frágil entre endpoints — substituída por aliases normalizados e fusão.
6. Posts fixados antigos podiam distorcer a amostra — agora seguem a janela pela data.
7. Sem versão própria nem contexto persistido — adicionados versão, data, amostra, seguidores e histórico.
8. Rótulo ambíguo e metodologia incompleta — corrigidos na interface.
9. Classificação duplicada dentro do cálculo — centralizada e testada nas bordas.

## Testes

`src/lib/analysis/engagement.test.ts` cobre cenário básico, post viral, um post, zero seguidores, curtidas ausentes, comentários zero, duplicatas de endpoints, fixado antigo, mediana par, bordas sem arredondamento, limite, ordenação e data ausente. Os testes existentes cobrem fluxo de view model, estados e renderização dos componentes sem chamadas externas.

## Riscos remanescentes

- O fluxo público consulta apenas uma página de cada endpoint; a configuração máxima não força novas chamadas e pode receber menos de 20 itens.
- A confiabilidade real dos campos do fornecedor ainda depende de amostragem operacional documentada.
- Perfis de portes diferentes usam os mesmos limites até existir calibração baseada em dados e decisão de produto.
- `legacy-v1` descreve resultados sem metadados suficientes para reconstruir exatamente quais campos parciais entraram.
- O ranking visual de top posts ainda usa comentários com peso 2; ele não interfere na taxa, mas é uma métrica distinta que deve permanecer documentada.

## Recomendação para IA futura

Qualquer integração futura deve consumir apenas o objeto versionado e seus campos de amostra/confiança, nunca recalcular a taxa a partir de textos ou dados brutos. Recomendações geradas devem declarar quando a confiança for baixa ou insuficiente e manter média, mediana e views como conceitos separados.
