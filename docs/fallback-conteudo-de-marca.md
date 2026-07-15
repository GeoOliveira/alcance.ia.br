# Fallback da pesquisa de conteúdo de marca

O fallback começa desligado. `shouldFallback()` aceita somente códigos fechados e erros marcados como transitórios. Timeout, indisponibilidade técnica e resposta inválida podem ser elegíveis. Validação, autenticação, permissão, limite, plano, recurso desligado e vazio válido não são elegíveis.

`fallback_on_empty=false` é o padrão. Quando explicitamente ativado, uma resposta vazia pode gerar custo e cobertura diferente. A troca de provedor reinicia a paginação; resultados não são unidos silenciosamente.
