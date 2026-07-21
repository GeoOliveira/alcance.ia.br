# Encurta.io no gerenciador

A criação reutiliza `POST /api/internal/v1/links`: Bearer, HMAC-SHA256, request ID e replay idempotente. O navegador chama apenas `/api/painel/links`; telefone e mensagem são validados e credenciais ficam server-only.

O registro local associa ID, slug e URL ao `auth.uid()`. Não foram inventados endpoints de PATCH de destino, bloqueio, delete ou métricas.
