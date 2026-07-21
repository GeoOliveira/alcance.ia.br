# Erros do encurtador

O cliente transforma respostas externas em mensagens seguras:

- `429`: limite atingido; não repete automaticamente.
- `409 IDEMPOTENCY_CONFLICT`: conflito de request ID; não repete.
- `502/503/504`: indisponibilidade; permite no máximo um retry com o mesmo request ID.
- timeout/falha de rede: retry idempotente; depois preserva o link oficial.
- resposta inválida: falha sanitizada, sem corpo bruto.
- integração desativada ou sem credenciais: fallback imediato para o link oficial.

Telefone, mensagem, assinatura, Authorization, payload bruto e resposta bruta não entram em analytics nem logs da Alcance IA.
