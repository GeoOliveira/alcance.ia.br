# Testes da integração Encurta.io

Os testes mockados cobrem configuração desativada, headers e payload do contrato, HMAC, resposta 201, replay 200, retry de 503 e conflito 409. Não há chamada real à produção.

Para validação em Preview, configure credenciais de Preview no ambiente Vercel, aplique a migration privada do projeto Encurta.io e habilite as flags somente depois de testar criação, replay, timeout, limite e fallback. Nunca use credenciais de produção no teste inicial.
