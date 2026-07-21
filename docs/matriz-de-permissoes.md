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
| Editar SEO de páginas | ✓ | ✓ | ✓ | — | — |
| Gerar rascunhos SEO por IA | ✓ | ✓ | ✓ | — | — |
| Criar/editar FAQ | ✓ | ✓ | ✓ | — | — |
| Excluir FAQ | ✓ | ✓ | — | — | — |
| Configurações operacionais | ✓ | ✓ | — | — | — |
| Feature flags | ✓ | — | — | — | — |
| Listar administradores | ✓ | ✓ | — | — | — |
| Criar/alterar/desativar administradores | ✓ | — | — | — | — |
| Auditoria | ✓ | ✓ | — | — | — |

As verificações existem em quatro camadas: proxy, página do servidor, Server Action/rota e RLS/RPC. Ocultar um item do menu é apenas uma melhoria de interface, não um controle de segurança.

`super_admin` não pode ser concedido pelo painel. Perfis não são apagados fisicamente e o trigger `protect_last_super_admin` impede desativar ou rebaixar o último `super_admin` ativo.
# Matriz de permissões

Além das permissões existentes, `seo.manage` permite consultar e alterar o catálogo fechado de SEO, enquanto `seo.ai.generate` autoriza o consumo da integração para gerar rascunhos. Ambas são concedidas a `super_admin`, `admin` e `editor`. Todas as verificações são repetidas no servidor; esconder um link não concede nem revoga acesso.
