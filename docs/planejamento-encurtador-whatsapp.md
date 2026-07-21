# Planejamento do encurtador de links do WhatsApp

Este documento descreve uma etapa futura. Nenhum item abaixo foi implementado.

## Arquitetura proposta

- Domínio curto dedicado com HTTPS, observabilidade e política de disponibilidade.
- Slugs aleatórios não enumeráveis e slugs personalizados reservados por conta/plano.
- Tabela separada para destino, proprietário, status, expiração e timestamps; telefone e mensagem devem receber classificação e retenção explícitas.
- Redirecionamento server-side com lista de destinos permitidos, validação estrita de `wa.me`, proteção contra open redirect e cache compatível com revogação.
- Expiração, desativação, exclusão e prevenção de colisões de slug.

## Analytics e privacidade

- Contagem agregada de cliques com deduplicação, retenção limitada e consentimento quando aplicável.
- Não registrar query string de destino, telefone ou mensagem em logs, analytics ou ferramentas de sessão.
- Painel com métricas explicadas, sem identificação invasiva do visitante.

## Produto

- Limites por plano e por usuário, sem bloquear o gerador oficial gratuito.
- Histórico autenticado e exportação controlada.
- QR Code gerado a partir do link curto validado.
- Domínios e slugs personalizados como recursos independentes e administráveis.

## Proteção contra abuso

- Rate limiting por conta, sessão e sinais de infraestrutura.
- Detecção de destinos alterados, phishing, enumeração e automação abusiva.
- Moderação, denúncia, bloqueio e trilha de auditoria.
- Testes de redirects, cache, expiração, concorrência, autorização e não vazamento de dados.

Antes da implementação, devem ser definidos modelo de dados, base legal, retenção, política de conteúdo, limites comerciais, SLO do redirecionador e plano de migração/reversão.
