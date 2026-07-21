# Gerenciador de Links WhatsApp

Produto autenticado em `/painel` para criar e organizar URLs curtas do WhatsApp, gerar QR Codes localmente e exibir somente métricas agregadas verificadas. A landing pública fica em `/recursos/gerenciador-links-whatsapp`.

`resource_whatsapp_link_manager`, login Google e One Tap começam desligados. Sem a flag principal, o painel apresenta indisponibilidade e a landing não é indexada nem acessível. Não há cobrança, deploy automático ou aplicação remota de migrations.

Inclui cadastro/login/recuperação no Supabase, Google GIS com nonce e fallback OAuth, criação real pelo contrato existente do Encurta.io, organização, QR Code PNG/SVG e base para métricas. Edição de destino, bloqueio, exclusão remota e métricas remotas ficam bloqueados até existirem contratos verificados.

O Client ID e as origens Google podem ser administrados em `/admin/integracoes/google`. O Client Secret permanece exclusivamente no provider Google do Supabase.
