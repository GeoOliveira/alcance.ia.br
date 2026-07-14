# Analytics, monitoramento e funil

## Objetivo e arquitetura

A medição acompanha visita, interação, envio, criação da solicitação, processamento, prévia e início de cadastro. Nenhum evento contém nome, e-mail, mensagem, senha ou usuário do Instagram.

Os componentes não chamam GA4 ou Clarity diretamente. `trackEvent` valida o nome, aplica uma lista permitida de propriedades, acrescenta atribuição autorizada, bloqueia sem consentimento e deduplica. Um evento interno é então encaminhado aos provedores configurados.

Arquivos principais:

- `src/lib/analytics/types.ts`: taxonomia e propriedades tipadas;
- `track.ts`: consentimento, sanitização e deduplicação;
- `attribution.ts`: UTMs, first touch e last touch;
- `providers.ts`: GA4, Clarity e interfaces futuras;
- `src/components/analytics/analytics-loader.tsx`: scripts, page views do App Router e Vercel;
- `src/instrumentation-client.ts`: falhas globais sem stack trace ou conteúdo.

## Consentimento

As categorias são essenciais, funcionais, analíticas e marketing. Essenciais permanecem ativos. A decisão contém versão e timestamp e pode ser alterada pelo rodapé.

GA4, Clarity, Vercel Web Analytics e Speed Insights não são renderizados antes do consentimento analítico. A função de tracking também bloqueia eventos, criando uma segunda barreira. Ao revogar, novos eventos deixam de ser enviados; scripts já executados podem permanecer na memória até recarregar a página, por isso a interface informa que a revogação vale para usos futuros.

`cookie_banner_viewed` não é enviado na primeira visita, porque ainda não existe autorização. Ele pode ser medido quando uma pessoa que já consentiu reabre as preferências. `cookie_consent_updated` só é enviado quando a nova escolha autoriza analytics.

## Eventos

Navegação: `page_view`, `legal_page_viewed`, `faq_opened`, `navigation_clicked`.

Análise: `analysis_form_viewed`, `analysis_form_started`, `analysis_form_validation_error`, `analysis_request_submitted`, `analysis_request_succeeded`, `analysis_request_failed`, `analysis_rate_limited`.

Funil: `analysis_processing_viewed`, `analysis_preview_viewed`, `signup_cta_clicked`, `signup_started`, `signup_completed`, `login_clicked`.

Contato: `contact_form_started`, `contact_form_submitted`, `contact_form_succeeded`, `contact_form_failed`.

Consentimento: `cookie_banner_viewed`, `cookie_consent_updated`, `cookie_preferences_opened`.

Erros: `client_error` e `server_action_failed`. Códigos são categorias curtas, como `http_429` ou `network_error`; mensagens, stack traces, cookies, headers e corpos não são enviados.

Propriedades permitidas: `page_path`, `cta_location`, `form_name`, `error_code`, `request_id`, `consent_category`, `navigation_target`, UTMs e `referrer_domain`. O provedor determina dimensões como categoria de dispositivo. Qualquer propriedade desconhecida, inclusive `email`, `message` ou `instagram`, é removida em runtime.

## Page views e GA4

O GA4 é configurado com `send_page_view: false`, sem Google Signals ou personalização publicitária. O App Router envia um único `page_view` explícito por caminho e query. Para evitar duplicação, desative também no fluxo de dados do GA4 a medição otimizada de “Page changes based on browser history events”.

Configuração:

1. Crie uma propriedade GA4 e um fluxo Web para o domínio.
2. Copie o Measurement ID no formato `G-...`.
3. Cadastre `NEXT_PUBLIC_GOOGLE_ANALYTICS_ID` na Vercel para Production.
4. Em GA4, abra Admin → Data streams → fluxo Web → Enhanced measurement e desative page views por mudanças no histórico.
5. Faça um novo deploy e aceite cookies analíticos.
6. Valide em DebugView, Realtime, Tag Assistant e na aba Network procurando `google-analytics.com/g/collect`.

GTM não é usado em paralelo. Se a arquitetura migrar para GTM, remova o carregador direto de GA4 antes de ativá-lo.

## UTMs e atribuição

São aceitos apenas `utm_source`, `utm_medium`, `utm_campaign`, `utm_content` e `utm_term`, com até 200 caracteres e remoção de controles e marcação. `gclid` não é coletado porque não há publicidade ativa.

- First touch: primeira origem conhecida. Não é sobrescrita e alimenta os campos UTM atuais da solicitação.
- Last touch: origem da entrada mais recente, armazenada separadamente para análise futura.
- Referrer: apenas o domínio externo, nunca a URL completa.
- Direct: ausência de UTM e referência externa válida.

Antes do consentimento, a atribuição existe somente em memória durante a navegação atual. Após consentimento analítico, first e last touch são persistidos em `localStorage`. Isso permite enviar a origem ao servidor junto à solicitação sem criar armazenamento analítico persistente antes da escolha.

## Vercel Web Analytics e Speed Insights

Os pacotes `@vercel/analytics` e `@vercel/speed-insights` estão instalados e os componentes são condicionados ao consentimento. A presença do código não ativa os produtos no painel.

Na Vercel, abra o projeto e habilite separadamente Web Analytics e Speed Insights. Um deploy posterior cria as rotas de coleta. Use os filtros de ambiente e dispositivo para investigar conversão e Core Web Vitals.

## Microsoft Clarity

1. Crie um projeto no Clarity e cadastre o domínio.
2. Copie somente o Project ID para `NEXT_PUBLIC_CLARITY_ID` na Vercel.
3. Faça novo deploy e aceite consentimento analítico.
4. Confirme no painel que gravações surgem apenas após consentimento.

Todos os formulários públicos usam `data-clarity-mask="true"`. O código não chama Identify e não envia identificadores personalizados. Conteúdo de inputs e áreas de texto permanece mascarado; revise essa configuração também no painel antes de liberar gravações.

## Provedores futuros

Meta Pixel, Pinterest Tag e Reddit Pixel estão declarados como provedores inativos. IDs vazios não carregam scripts. Uma ativação futura exige adaptador próprio, consentimento de marketing, revisão jurídica, testes de revogação e bloqueio em desenvolvimento.

## Métricas do funil

- Início da análise: `analysis_form_started / page_view`.
- Envio com sucesso: `analysis_request_succeeded / page_view`.
- Conclusão do formulário: `analysis_request_succeeded / analysis_form_started`.
- Visualização da prévia: `analysis_preview_viewed / analysis_request_succeeded`.
- Início do cadastro: `signup_started / analysis_preview_viewed`.
- Cadastro futuro: `signup_completed / signup_started`.

Use as taxas para comparação histórica e entre campanhas, não como metas universais. Para abandono, compare eventos consecutivos no funil e segmente por origem, campanha, caminho e categoria de dispositivo fornecida pelo provedor.

## Validação manual

1. Em janela privada, confirme ausência de scripts GA4, Clarity e `/_vercel/insights` antes da escolha.
2. Rejeite não essenciais e repita a inspeção.
3. Aceite analytics e confirme um único `page_view` por navegação.
4. Teste Configurar, alteração pelo rodapé e revogação.
5. Envie análise válida, inválida e limitada; confira a sequência de eventos sem usuário do Instagram.
6. Passe por processamento, prévia e CTA de cadastro.
7. Envie contato com sucesso e erro; confira que nome, e-mail e mensagem não aparecem.
8. Teste navegação privada, celular e bloqueadores de conteúdo.
9. Valide GA4 DebugView, Clarity e painéis Vercel separadamente.

## Privacidade, limitações e próximos passos

GA4 e Clarity podem sofrer bloqueio por navegador ou extensões. Métricas baseadas em consentimento não representam todo o tráfego. A revogação não apaga dados já recebidos pelos provedores e scripts carregados podem exigir recarga para desaparecer da memória.

Não há Sentry configurado. Error boundaries e categorias locais estão prontos, mas sem um provedor externo erros não são armazenados quando analytics está desativado. Antes de adicionar Sentry, filtre cookies, headers, corpos, PII e source maps.

O `npm audit` aponta uma vulnerabilidade moderada no PostCSS empacotado pelo Next.js 16.2.10; a correção automática sugerida é um downgrade incompatível e não foi aplicada. Acompanhe uma atualização estável do Next.js que incorpore PostCSS corrigido.

As alterações jurídicas são pontuais e exigem revisão profissional antes da operação comercial. Próximos passos: habilitar os painéis, configurar IDs, validar em produção com consentimento, criar dimensões personalizadas necessárias no GA4 e estabelecer rotina de revisão de qualidade dos eventos.
