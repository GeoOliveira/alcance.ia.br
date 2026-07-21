# Gerador de Link WhatsApp Curto

## Objetivo e rota

A ferramenta pública em `/recursos/gerador-link-whatsapp` cria um link oficial `https://wa.me/` para um telefone brasileiro. A mensagem é opcional. Quando a integração está liberada para o nível de acesso do usuário, o backend também solicita um link curto ao Encurta.io.

## Telefone e normalização

`normalizeBrazilianWhatsAppNumber()` concentra a validação. Ela aceita DDD + telefone com ou sem máscara e com código `55` opcional, valida o DDD em uma lista central e devolve país, DDD, número local, formato nacional e número internacional. Celulares devem ter nove dígitos e começar por 9; fixos têm oito dígitos e começam entre 2 e 5. Letras, controles, ramal, múltiplos números, DDD inexistente e comprimentos inválidos são rejeitados.

A máscara `(DD) 99999-9999` é somente visual. Nenhuma validação depende dela.

## Geração e mensagem

`generateWhatsAppLink()` usa `URL` e `URLSearchParams`. A mensagem aceita acentos, emoji, pontuação e quebra de linha, tem limite administrável (500 por padrão) e rejeita caracteres de controle e sequências invisíveis abusivas. O resultado é validado novamente antes de o botão externo ser renderizado.

## Integração opcional com Encurta.io

Quando `encurta_integration`, `whatsapp_link_shortener`, a flag do nível de acesso e o metadata `shortenerEnabled` estão ativos, a rota server-side `/api/whatsapp-links/shorten` envia o destino ao Encurta.io com HMAC, timeout, retry controlado e idempotência. Credenciais nunca chegam ao navegador. A integração permanece desativada por padrão; consulte `/admin/recursos/whatsapp_link_generator` para diagnóstico e teste controlado.

## Privacidade e analytics

O link oficial é montado no navegador. Quando o link curto é solicitado, telefone e mensagem são transmitidos por HTTPS ao Encurta.io para criar o redirecionamento. As novas URLs curtas usam slug alfanumérico de 4 caracteres; a validação também preserva links existentes com até 32 caracteres. Analytics e observabilidade recebem apenas status, nível de acesso, duração, retry e códigos sanitizados; telefone, mensagem, slug e URLs completas não são registrados.

## Administração e flags

O recurso `whatsapp_link_generator` aparece em `/admin/recursos`. Status, visibilidade, audiência, indexação, limite diário preparado, mensagem, limite de caracteres, botões e aviso de indisponibilidade são armazenados no catálogo/metadata. Os textos da landing page ficam em `site_content`, seção `whatsapp_generator`, e são editáveis em `/admin/conteudo/paginas` sem HTML arbitrário.

Flags: `resource_whatsapp_link_generator`, `whatsapp_link_custom_message`, `whatsapp_link_copy`, `whatsapp_link_open`, `whatsapp_link_share`, `encurta_integration`, `whatsapp_link_shortener`, `whatsapp_link_shortener_anonymous`, `whatsapp_link_shortener_free`, `whatsapp_link_shortener_premium`, `whatsapp_link_shortener_share`, `whatsapp_link_shortener_history` e `whatsapp_link_qr_code`. Todas as barreiras do Encurta.io começam desativadas.

## SEO

A rota está no catálogo SEO administrável, possui canonical, Open Graph, breadcrumbs e dados estruturados `WebApplication` e `FAQPage`. O sitemap inclui a página somente quando o recurso está acessível e indexável. Links gerados nunca alteram a URL da página nem entram em metadata.

## Testes e limites

Os testes cobrem telefone, mensagem, encoding, HMAC, configuração fail-closed, headers, resposta externa, retry, conflito, erros não elegíveis, níveis de acesso, rate limit e resposta sanitizada da rota. A versão atual não consulta se o número possui WhatsApp e não implementa QR Code, histórico de links, métricas de clique, envio de mensagem, API pública ou países adicionais.

Para validar localmente: `npm run lint`, `npm run typecheck`, `npm test` e `npm run build`. As migrations `202607170021_whatsapp_link_generator.sql` e `202607170022_whatsapp_shortener_integration.sql` devem ser aplicadas pelo fluxo controlado do ambiente; esta implementação não as aplica remotamente.
