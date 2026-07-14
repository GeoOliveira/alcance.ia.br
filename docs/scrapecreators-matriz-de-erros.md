# Matriz de erros da ScrapeCreators

| Cenário | HTTP/resposta do fornecedor | Erro interno | Retry | Mensagem segura | Tratamento futuro |
|---|---|---|---|---|---|
| Ambiente, flag ou setting inativo | sem chamada | `configuration` | não | POC desativada/configuração ausente | manter bloqueado |
| Chave ausente | sem chamada | `configuration` | não | fornecedor não configurado | configurar segredo |
| Nome/URL inválido | sem chamada | validação local | não | entrada inválida | corrigir entrada |
| Chave inválida/proibida | 401/403 | `authentication` | não | autenticação falhou | revisar chave/conta |
| Perfil/conteúdo inexistente | 404 | `not_found` | não | não encontrado | informar com segurança |
| Perfil privado | resposta a confirmar em teste real | `private_profile` reservado | não | perfil privado indisponível | impedir análise |
| Limite do fornecedor | 429 | `rate_limit` | não automático | limite temporário atingido | aguardar e controlar consumo |
| Falha temporária | 500/502/503/504 | `provider_error` | uma vez, 250 ms | fornecedor não concluiu | monitorar frequência |
| Timeout | sem HTTP | `timeout` | não | tempo limite excedido | ajustar timeout/investigar |
| Não JSON/JSON inválido/grande | 2xx atípico | `invalid_response` | não | resposta inválida | registrar inventário sanitizado |

O status específico de perfil privado e a forma exata do payload ainda precisam ser confirmados com uma conta privada de teste; até lá, 403 permanece classificado com segurança como autenticação/proibição, sem expor o corpo integral.
