# Página individual de análise

## Objetivo

A rota `/analisar/[requestId]` é a interface server-first que processa e apresenta dados públicos reais do Instagram. A análise determinística é sempre a fonte principal; quando a integração está deliberadamente ativa, uma camada separada de IA organiza interpretações sem substituir ou bloquear as métricas.

## Fluxo e proteção

O formulário da Home valida e cria `analysis_requests`, grava o estágio `queued` e redireciona imediatamente. A página verifica o cookie HTTP-only `alcance_anonymous_session`; um UUID de outra sessão não permite leitura ou processamento. O componente de carregamento inicia o processamento no servidor e consulta apenas estado/estágio seguro. O resultado principal é renderizado por Server Components.

O processamento consulta perfil e, se público, posts e Reels. Estágios reais (`profile`, `content`, `metrics`, `complete`) são persistidos. Resultados concluídos do mesmo username podem ser reutilizados por 30 minutos, configuráveis com `ANALYSIS_RESULT_CACHE_MINUTES`, evitando novas chamadas. Falhas não são reprocessadas diretamente pela URL.

## Dados e métricas

A migration `202607140005_analysis_results.sql` cria `analysis_results`, sem grants públicos e com RLS. Ela armazena contratos normalizados, métricas determinísticas, observações por regras, qualidade, timestamps e metadados técnicos mínimos. Respostas brutas, chaves e headers não são expostos.

Métricas: seguidores/seguindo, médias e medianas de curtidas/comentários, engajamento médio e típico estimados por seguidores, média de views de Reels, formatos, posts em 7/30 dias, intervalo médio, melhor post e melhor formato observado. A taxa versionada `engagement-v2` exige curtidas e comentários observados no mesmo post, usa até 20 publicações dos últimos 90 dias e mantém views separadas. Valores ausentes permanecem `null` e aparecem como “Não disponível” ou “Dados insuficientes”. Consulte `docs/auditoria-metrica-engajamento.md` e `docs/dicionario-de-metricas.md`.

O ranking usa interações conhecidas (`curtidas + 2 × comentários`) e views apenas como desempate. Classificações de engajamento, consistência e variedade estão em `analysis-metrics.ts`; não são uma nota definitiva.

A camada avançada `v2.0.0` adiciona completude, relação seguidores/seguindo, diversidade e desempenho por formato, estabilidade e concentração, tendência recente, regularidade, estrutura de legendas, CTAs, hashtags e plano de ação por regras. Esses indicadores são calculados em `src/lib/analysis/metrics`, persistidos como JSONB versionado e ativados para o fluxo público pela migration `202607150009_public_analysis_flow.sql`. Resultados antigos ou reutilizados são recalculados em memória quando o conjunto de módulos ativo mudou. Destaques são explicitamente marcados como não coletados, sem chamada adicional ao provedor. Fórmulas e limites estão em [metricas-avancadas-deterministicas.md](metricas-avancadas-deterministicas.md).

## Estrutura visual e estados

O relatório contém cabeçalho compacto, resumo executivo, diagnóstico inicial, visão geral, métricas, consistência, formatos, melhores publicações, metodologia, recursos futuros e CTA final. O layout é responsivo para 320–1440 px, usa CSS leve e `next/image` para mídias permitidas.

### Direção visual e hierarquia

O refinamento visual usa superfícies claras, bordas discretas, sombras leves e verde da marca como cor funcional. O engajamento estimado é a métrica dominante; consistência, melhor formato e oportunidade aparecem como sinais de apoio. As demais seções alternam cartões, comparações e blocos editoriais para evitar que todo conteúdo tenha o mesmo peso.

Os tokens exclusivos do relatório ficam centralizados em `src/app/analisar/analysis.css`: fundos, superfícies, textos, bordas, estados, raios, sombras e espaçamento vertical. Os componentes continuam desacoplados do fornecedor e recebem apenas o view model normalizado.

### Tipografia, contraste e avisos

A página usa uma escala sem valores inferiores a 12 px. Badges, datas, rótulos curtos, navegação auxiliar e metadados podem usar 12 px; descrições, limitações, estados de dados insuficientes, textos de apoio e ações usam no mínimo 14 px com `line-height` entre 1,55 e 1,7. Textos editoriais e metodologia podem chegar a 16 px, títulos de cards partem de 16 px e valores de métricas permanecem dominantes em 26–28 px no mobile/desktop. Títulos de seção continuam responsivos entre 27 e 39 px.

Os níveis de cor do relatório são:

- `--analysis-text: #17221d`, para títulos, valores e conteúdo principal;
- `--analysis-muted: #58665d`, para descrições e explicações secundárias;
- `--analysis-subtle: #657269`, reservado a metadados e rótulos curtos;
- `--analysis-text-on-dark: #dce7e0`, para descrições sobre a superfície verde escura.

Em superfícies brancas e claras, os tokens de texto normal buscam contraste mínimo de 4,5:1; rótulos não dependem apenas de cor. Avisos de amostra parcial usam bloco informativo leve com ícone, borda e fundo neutros, texto mínimo de 14 px e `role="note"`. Erros e estados de indisponibilidade permanecem visíveis no fluxo, também com texto mínimo de 14 px, sem transferir informação essencial para tooltips.

Nas larguras de 320, 375, 390 e 430 px, descrições não são reduzidas para caber: os cards ganham altura, a grade de métricas passa a uma coluna até 430 px, fatos passam a uma coluna até 360 px e a navegação de seções continua rolável. Blocos metodológicos limitam a largura útil no desktop e usam entrelinha confortável para evitar linhas excessivamente longas. O foco global permanece visível e a interface continua compatível com zoom de 200%.

### Componentes e visualizações

- `AnalysisSectionNav`: navegação interna fixa no desktop e horizontal rolável no mobile;
- `AnalysisHeroSummary`: métrica dominante, escala textual e oportunidades reais da amostra;
- `AnalysisInsightsCard`: até três prioridades com impacto e próximo passo determinísticos;
- `AnalysisMetricsGrid`: ícones SVG leves, contexto por métrica e variação visual de destaque;
- `AnalysisConsistencyCard`: comparação acessível de 7 e 30 dias, sem inferir distribuição inexistente;
- `AnalysisContentFormatBreakdown`: barra de composição e indicação textual do melhor formato;
- `AnalysisTopPosts`: galeria responsiva com proporção estável, data e estado vazio;
- `AnalysisMethodology`: acordeão nativo com fonte, amostra e limitações;
- `AnalysisProfileCompleteness`: score, barra e critérios presentes/ausentes;
- `AnalysisEngagementDiagnostics`: estabilidade, concentração e conteúdos fora da curva;
- `AnalysisRecentTrend`: comparação neutra entre grupos cronológicos;
- `AnalysisPublicationStructure`: legendas, CTAs, hashtags e indisponibilidade de destaques;
- `AnalysisActionPlan`: até três prioridades determinísticas com evidência e confiança;
- `AnalysisAIState`: mantém as métricas visíveis, mostra “Preparando insights” e atualiza a seção automaticamente;
- `AnalysisAIInterpretation`: resumo, bio, pontos fortes, oportunidades, próximas ações, ideias e limitações;
- `AnalysisUpgradeCta`: prévia claramente marcada como “Em breve”, separada do valor real.

### Responsividade, acessibilidade e performance

No mobile, cabeçalho, resumo, prioridades e galeria são empilhados; a navegação não aumenta a largura da página; títulos e métricas usam escalas menores; áreas de ação mantêm tamanho confortável. Em 320 px, as grades de fatos e métricas passam a uma coluna quando necessário.

Gráficos possuem alternativa textual ou `aria-label`, o menu e a metodologia usam elementos nativos `details/summary`, estados não dependem apenas de cor, foco global permanece visível e animações respeitam `prefers-reduced-motion`. Não foram adicionadas bibliotecas, fontes ou JavaScript de visualização; os ícones são SVG inline e as barras usam CSS.

Estados suportados: aguardando, processando, concluído, parcial, poucos dados, não encontrado, privado, erro temporário e indisponível. Todas as páginas individuais usam `noindex`, `nofollow` e `nocache` e não entram no sitemap.

## Interpretação assistida por IA

O view model pode receber `aiAnalysis` somente após schema e consistência aprovados. A seção pública respeita os três controles mestres e `ai.public_visibility`, identifica claramente conteúdo gerado por IA e nunca esconde o resultado determinístico. Após a conclusão das métricas, a página mostra “Preparando insights”, consulta apenas o status seguro e faz `router.refresh()` quando a saída está pronta. A chamada ocorre com `after()`; análises concluídas antes da ativação também podem iniciar a etapa ao serem abertas. Falhas e confiança insuficiente encerram o estado de espera sem quebrar a análise principal. Consulte `docs/integracao-openai.md`.

## Telemetria e testes

Eventos cobrem visualização, conclusão, erro, seções, plano, metodologia, clique em post e CTA final, usando apenas `request_id`, `section_id` e contexto — nunca username, bio, legenda ou hashtags. Testes verificam métricas, nulos, amostras mínimas, regras, flags, migration, compatibilidade, noindex e renderização segura.

## Limitações e próximos passos

Contas privadas não podem ser analisadas; disponibilidade e campos dependem do Instagram; URLs de mídia podem expirar; a amostra inicial usa uma página de cada feed. A comparação de consistência mostra apenas agregados reais de 7 e 30 dias, pois o view model ainda não expõe distribuição semanal. Recomenda-se futuramente uma fila durável, histórico real para tendências e atualização solicitada pelo usuário.
