# Resposta normalizada — conteúdo de marca

A API interna nunca repassa resposta integral, `paging.next`, token, URL de requisição ou erro bruto da Meta. Ela retorna `results`, cursor `after` sanitizado e metadados de plataforma, consulta, período, quantidade carregada, cache e horário.

Cada item conserva `type` técnico e gera `typeLabel` defensivo. Como não há ID de conteúdo documentado, o ID interno é um SHA-256 estável de URL segura, data, criador e tipo. Entidades expõem somente `id`, `name`, username derivado de URL HTTPS do Instagram e `profileUrl`. Resultados são deduplicados por ID.

`paging.cursors.after` é o único dado de paginação aceito: opaco, até 1.000 caracteres, sem controles e ausente de analytics.
