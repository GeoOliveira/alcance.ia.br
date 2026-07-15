# Segurança da Pesquisa de Conteúdo de Marca

- `META_ACCESS_TOKEN` existe apenas em módulos `server-only`, sem `NEXT_PUBLIC_`, Supabase, UI ou analytics.
- URL externa usa base/versão centralizadas, `URL` e `URLSearchParams`; o navegador chama apenas a API interna fechada.
- A rota rejeita parâmetros desconhecidos/duplicados, identificadores simultâneos, cursor inválido, datas inválidas e URLs fora da allowlist.
- Página Facebook exige HTTPS em `facebook.com`/`www.facebook.com`, sem credenciais, query, fragmento ou caminho de grupo/post. `m.facebook.com` fica rejeitado porque não foi confirmado.
- Links de saída exigem HTTPS e `noopener noreferrer`.
- Logs não contêm URL Meta, token, resposta bruta ou `paging.next`.
- Rate limit reutiliza HMAC de IP e contadores globais/por ator. Falha de backend fecha o acesso.
- Persistência contém somente telemetria temporária por 30 dias; não há histórico público/resultados persistidos.
- RLS limita leitura a administradores; escrita ocorre pelo servidor.

Foram considerados SSRF, open redirect, parameter pollution, XSS, log injection, cache poisoning, credenciais, IDOR e bypass de flags/plano.
