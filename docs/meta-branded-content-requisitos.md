# Requisitos da Meta — Branded Content Search

Validação documental realizada em 15/07/2026 na [referência oficial do endpoint](https://developers.facebook.com/docs/graph-api/reference/branded_content_search/), na [referência do nó retornado](https://developers.facebook.com/docs/graph-api/reference/branded-content-search/) e na [referência da entidade](https://developers.facebook.com/docs/graph-api/reference/branded-content-search-entity/).

## Confirmado

- A referência está em `v25.0` e exemplifica `GET /v25.0/branded_content_search`.
- Parâmetros: `creation_date_min`, `creation_date_max` e exatamente um entre `ig_username` e `page_url`.
- Retorno em `data` e `paging`; campos `creation_date`, `creator`, `partners`, `type` e `url`. Não há `id` documentado para o conteúdo.
- Entidades possuem `id`, `name` e `url`; não há `username` documentado.
- Por padrão, a Meta retorna conteúdo ainda disponível e criado em ou após 17/08/2023.
- O único erro específico listado é `100 — Invalid parameter`.

## Pendências antes de produção

A referência não informa tipo de aplicativo, produto, permissões, tipo exato do access token, App Review, Business Verification, validade, limites específicos ou restrições regionais. Nada disso está presumido como aprovado. É obrigatório confirmar esses itens no painel/atendimento da Meta, testar em desenvolvimento e produção, validar contas permitidas, headers de limite, campos reais, datas, paginação e erros, e registrar uma resposta real sanitizada.

## Inconsistência documental

Os textos de `creation_date_min` e `creation_date_max` aparecem semanticamente invertidos (“after” para `max` e “before” para `min`). A implementação envia valores nos parâmetros homônimos, mas exige validação real.

O código está pronto para teste controlado, não para declaração de produção. Seeds e flags permanecem desligados. Nenhuma consulta real foi executada porque não foi fornecido token de teste validado.
