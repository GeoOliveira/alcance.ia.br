# Matriz de permissões administrativas

| Capacidade | super_admin | admin | editor | support | analyst |
|---|:---:|:---:|:---:|:---:|:---:|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ |
| Ver solicitações identificadas | ✓ | ✓ | — | ✓ | — |
| Alterar status/notas de solicitações | ✓ | ✓ | — | ✓ | — |
| Exportar solicitações | ✓ | ✓ | — | — | ✓, minimizado |
| Anonimizar/excluir solicitações | ✓ | — | — | — | — |
| Ver contatos e mensagens | ✓ | ✓ | — | ✓ | — |
| Alterar status/notas de contatos | ✓ | ✓ | — | ✓ | — |
| Exportar contatos | ✓ | ✓ | — | — | — |
| Excluir contato | ✓ | — | — | — | — |
| Editar Home | ✓ | ✓ | ✓ | — | — |
| Criar/editar FAQ | ✓ | ✓ | ✓ | — | — |
| Excluir FAQ | ✓ | ✓ | — | — | — |
| Configurações operacionais | ✓ | ✓ | — | — | — |
| Feature flags | ✓ | — | — | — | — |
| Listar administradores | ✓ | ✓ | — | — | — |
| Criar/alterar/desativar administradores | ✓ | — | — | — | — |
| Auditoria | ✓ | ✓ | — | — | — |

As verificações existem em quatro camadas: proxy, página do servidor, Server Action/rota e RLS/RPC. Ocultar um item do menu é apenas uma melhoria de interface, não um controle de segurança.

`super_admin` não pode ser concedido pelo painel. Perfis não são apagados fisicamente e o trigger `protect_last_super_admin` impede desativar ou rebaixar o último `super_admin` ativo.
