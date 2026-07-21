# Configuração do Encurta.io

Configure somente no ambiente server-side:

```env
ENCURTA_INTEGRATION_ENABLED=false
ENCURTA_API_URL=https://encurta.io
ENCURTA_API_KEY=
ENCURTA_HMAC_SECRET=
ENCURTA_INTEGRATION_SOURCE=alcance_ia
ENCURTA_REQUEST_TIMEOUT_MS=10000
ENCURTA_MAX_RETRIES=1
```

Não use prefixo `NEXT_PUBLIC_`, não salve chaves no Supabase e não exiba segredos no painel. Para Preview, use credenciais próprias do ambiente Encurta.io e habilite primeiro apenas as flags de Preview. A criação só fica disponível quando ambiente, credenciais e flags estiverem ativos.

`ENCURTA_API_URL` é obrigatória quando a integração é ativada e deve usar HTTPS. Valor ausente, inválido ou HTTP faz a integração falhar fechada; o sistema não troca silenciosamente para produção. Limites diários são lidos de `app_settings` por nível de acesso e as flags `whatsapp_link_shortener_anonymous`, `whatsapp_link_shortener_free` e `whatsapp_link_shortener_premium` são independentes.
