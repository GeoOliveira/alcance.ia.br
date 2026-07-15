# Arquitetura de provedores de conteúdo de marca

Fluxo: página → rota interna → `searchBrandedContent()` → resolução central → adaptador → resposta normalizada → cache → página.

Os adaptadores `meta_official` e `apify` implementam `BrandedContentProvider`. Componentes não possuem condicionais de provedor. O modo inicial é `meta_only`; `automatic_fallback` exige principal e fallback diferentes; `admin_compare` volta para Meta no contexto público.

O contrato normalizado contém plataforma, tipo original e label, data, criador, parceiros, URL segura e metadados internos de origem. A paginação é `cursor` para Meta e `complete` para a execução limitada da Apify. Cursores, URLs autenticadas e IDs internos nunca são enviados.

As caches incluem provedor e versão do normalizador. Execuções Apify equivalentes em andamento são deduplicadas em memória por instância. Em serverless, deduplicação e cache não são globais; uma futura fila/banco distribuído será necessária antes de escala pública.
