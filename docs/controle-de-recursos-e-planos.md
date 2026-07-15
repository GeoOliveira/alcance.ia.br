# Controle de recursos e planos

`getFeatureAccessMap` centraliza a decisão de acesso e considera estado, ativação, visibilidade, autenticação, acesso premium, role administrativa e limites. Componentes não implementam regras de plano.

`/admin/recursos` é restrito ao superadministrador, possui filtros e permite controlar acesso, estado, visibilidade, limites, dependências, custo estimado e categorias. Mudanças críticas exigem `ATIVAR` e todas as alterações são auditadas.
