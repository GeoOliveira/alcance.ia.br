# Autenticação de usuários

O painel usa Supabase Auth e os clientes SSR existentes. `src/proxy.ts` atualiza sessões e protege `/painel`; autorização e RLS são repetidas no servidor e no PostgreSQL.

Fluxos: `/entrar`, `/criar-conta`, `/recuperar-senha`, `/redefinir-senha`, `/verifique-seu-email` e `/auth/callback`. `/login` redireciona para `/entrar`. Recuperação usa resposta neutra e callbacks aceitam somente caminhos locais. Confirme que a política real de senha do Supabase é compatível com os 8 caracteres, letras e números mostrados na interface.
