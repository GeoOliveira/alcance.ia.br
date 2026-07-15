# Integração com a OpenAI

## Arquitetura e estado inicial

Fluxo: ScrapeCreators → contratos normalizados → métricas determinísticas versionadas → pacote sanitizado → Responses API → Structured Outputs → Zod → verificações de consistência → `ai_analysis_runs` → view model → interface.

A integração permanece desligada em três níveis: `OPENAI_AI_ANALYSIS_ENABLED=false`, `ai.enabled=false` e `ai_profile_analysis=false`. A migration 009 prepara as flags das subseções, mas não altera esses controles mestres nem a visibilidade `hidden`. A versão das métricas é `v2.0.0`; a fórmula `engagement-v2` está formalmente auditada em `docs/auditoria-metrica-engajamento.md`. O gate `ai.engagement_interpretation_audited=true` libera somente essa versão para o pacote, sem ativar a integração.

O processamento principal persiste e responde com as métricas antes da IA. O Route Handler agenda a etapa assistiva com `after()`. Uma falha da OpenAI cria uma execução sanitizada, mas não altera o resultado determinístico nem o status concluído da solicitação.

## API, SDK e modelo

É usado apenas o SDK oficial `openai`, somente em módulo `server-only`, pela Responses API. A chamada usa `responses.parse`, `zodTextFormat`, `store: false`, `max_output_tokens`, timeout, `AbortSignal`, metadados técnicos, zero retries automáticos e nenhuma tool. Não há web search, file search, acesso a URL, execução de código ou conversa persistente.

O modelo vem exclusivamente de `OPENAI_MODEL`; não há fallback oculto. A escolha deve considerar disponibilidade, Structured Outputs, custo e avaliação interna. Fontes oficiais: [Responses API](https://developers.openai.com/api/docs/guides/migrate-to-responses), [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs) e [modelos](https://developers.openai.com/api/docs/models).

## Entrada e minimização

`prepareSanitizedAIAnalysisInput()` cria no máximo 12 itens e trunca legendas a 400 caracteres. Remove e-mail, telefone, URL completa e menções; não inclui comentários, localização detalhada, áudio, mídia, headers, cookies, IP, autenticação, chave social, resposta bruta, IDs do fornecedor ou dados administrativos. A presença de link vira apenas booleano.

Bio e legendas ficam dentro de um objeto JSON delimitado como dados não confiáveis. O prompt afirma que instruções presentes nesses textos nunca devem ser obedecidas.

## Saída, schema e consistência

O schema `ai-profile-analysis-v1` é estrito, sem propriedades arbitrárias, e limita comprimentos e quantidades. O prompt é `profile-analysis-v1`. Após o parse do SDK, Zod valida novamente. Guardas verificam IDs de evidência, bio ausente, alegações de fraude/seguidores falsos, promessas, acesso ao Insights, aparência e diagnóstico psicológico. HTML é removido antes da persistência.

IDs estáveis incluem `engagement.mean_rate`, `engagement.median_rate`, `profile.completeness`, `publishing.regularity`, `trend.recent_performance`, `content.diversity`, `content.best_format`, `content.performance_concentration`, `caption.cta_usage` e `caption.hashtag_usage`. Engajamento só entra quando o gate auditado permanece ativo.

## Persistência, cache, retry e custo

`ai_analysis_runs` registra versão, modelo, hash SHA-256 da entrada, snapshots sanitizados, status, tokens, duração, cache, validação, consistência e erro seguro. Não persiste resposta bruta. RLS não oferece leitura pública nem escrita pelo cliente. O cache exige mesmo hash, modelo, prompt e schema dentro de `ai.cache_hours`; índice parcial deduplica processamento concorrente.

O SDK não repete chamadas. Falhas 429, timeout e 5xx são classificadas como transitórias; uma nova tentativa exige ação posterior e `ai.retry_enabled`. O limite de saída e as quantidades configuráveis controlam custo. `estimated_cost_usd` permanece nulo até existir tabela de preços aprovada e versionada; o painel não inventa preço corrente.

## Interface e administração

`/admin/integracoes/openai` mostra controles, presença da chave sem valor, modelo, versões, uso diário, tokens, duração, erros e cache. O teste administrativo escolhe análise, recursos e cache, sem prompt livre. `/execucoes` e `/execucoes/[id]` mostram metadados e JSON estruturado sanitizado.

A migration inicia `ai.public_visibility` em `hidden`. Depois da ativação deliberada, a página mantém todo o relatório determinístico visível, mostra “Preparando insights” e acompanha a execução por status seguro. A saída completa contém Resumo, Análise da bio, Pontos fortes, Oportunidades, Próximas ações, Ideias de conteúdo e Limitações. `preview` limita o conjunto permitido, `full` mostra o conjunto completo e `hidden` não consulta nem exibe a saída.

## Retenção e operação

Defaults: entrada 7 dias, saída 90 dias e erros 30 dias. `supabase/scripts/openai-expired-data.sql` apenas lista expirados; as mutações ficam comentadas para revisão. Não há exclusão destrutiva silenciosa.

## Testes e ativação gradual

1. Aplicar migrations localmente/Preview após revisão.
2. Configurar chave e modelo somente no servidor, mantendo os três controles desligados.
3. Testar pelo painel com análise sem dados sensíveis e validar pacote, evidências, tokens e erros.
4. Executar casos de avaliação e falhas simuladas sem tokens reais nos testes automatizados.
5. Ativar primeiro ambiente, depois setting e por último flags; revalidar o gate se a fórmula deixar de ser `engagement-v2`.
6. Monitorar taxa de sucesso, duração, tokens, alegações bloqueadas e cache antes de ampliar visibilidade.

Limitações: não há fila durável externa; `after()` depende do suporte da plataforma. Não há cálculo automático de preço, moderação por endpoint separado, análise de imagem, comentários, histórico editorial, pagamento ou garantia de resultado.
