# Página individual de análise

## Objetivo

A rota `/analisar/[requestId]` é a interface server-first que processa e apresenta dados públicos reais do Instagram. Ela substitui a antiga progressão simulada, sem implementar recomendações avançadas ou conteúdo gerado por IA.

## Fluxo e proteção

O formulário da Home valida e cria `analysis_requests`, grava o estágio `queued` e redireciona imediatamente. A página verifica o cookie HTTP-only `alcance_anonymous_session`; um UUID de outra sessão não permite leitura ou processamento. O componente de carregamento inicia o processamento no servidor e consulta apenas estado/estágio seguro. O resultado principal é renderizado por Server Components.

O processamento consulta perfil e, se público, posts e Reels. Estágios reais (`profile`, `content`, `metrics`, `complete`) são persistidos. Resultados concluídos do mesmo username podem ser reutilizados por 30 minutos, configuráveis com `ANALYSIS_RESULT_CACHE_MINUTES`, evitando novas chamadas. Falhas não são reprocessadas diretamente pela URL.

## Dados e métricas

A migration `202607140005_analysis_results.sql` cria `analysis_results`, sem grants públicos e com RLS. Ela armazena contratos normalizados, métricas determinísticas, observações por regras, qualidade, timestamps e metadados técnicos mínimos. Respostas brutas, chaves e headers não são expostos.

Métricas: seguidores/seguindo, médias e medianas de curtidas/comentários, engajamento estimado por seguidores, média de views de Reels, formatos, posts em 7/30 dias, intervalo médio, melhor post e melhor formato observado. Valores ausentes permanecem `null` e aparecem como “Não disponível” ou “Dados insuficientes”.

O ranking usa interações conhecidas (`curtidas + 2 × comentários`) e views apenas como desempate. Classificações de engajamento, consistência e variedade estão em `analysis-metrics.ts`; não são uma nota definitiva.

## Estrutura visual e estados

O relatório contém cabeçalho, resumo, visão geral, métricas, consistência, formatos, melhores publicações, observações iniciais, recursos futuros e CTA final. O layout é responsivo para 320–1440 px, usa CSS leve e `next/image` para mídias permitidas.

Estados suportados: aguardando, processando, concluído, parcial, poucos dados, não encontrado, privado, erro temporário e indisponível. Todas as páginas individuais usam `noindex`, `nofollow` e `nocache` e não entram no sitemap.

## IA futura

O view model reserva `aiSummary`, `bioAnalysis`, `contentIdeas`, `recommendedActions` e `captionSuggestions`, todos opcionais e ausentes agora. A interface comunica esses recursos como futuros, sem fingir resultados.

## Telemetria e testes

Eventos cobrem visualização, conclusão, erro, clique em post e CTA final, usando apenas `request_id` e contexto — nunca username. Testes verificam métricas, nulos, ranking, observações, estados, view model, noindex e renderização segura.

## Limitações e próximos passos

Contas privadas não podem ser analisadas; disponibilidade e campos dependem do Instagram; URLs de mídia podem expirar; a amostra inicial usa uma página de cada feed. Antes do deploy, aplicar manualmente a migration, validar um perfil de teste e observar consumo/créditos. Recomenda-se futuramente uma fila durável para recuperação automática de processamentos interrompidos e regras de atualização solicitada pelo usuário.
