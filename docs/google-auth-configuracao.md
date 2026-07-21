# Configuração do Google Auth

1. Configure projeto, Branding, Audience, domínio verificado, homepage, logo, Política de Privacidade e Termos na Google Auth Platform.
2. Em Data Access, mantenha somente `openid`, `email` e `profile`.
3. Crie um OAuth Client ID **Web application**. Em **Authorized JavaScript origins**, cadastre `https://alcance.ia.br` e, para desenvolvimento, `http://localhost:3000`.
4. No Supabase, habilite Google e informe Client ID/Secret exclusivamente no painel do provedor.
5. Em **Authorized redirect URIs** do Google, cadastre `https://qcuqjxhvjknstsmtnkzs.supabase.co/auth/v1/callback` para o fluxo OAuth.
6. No Supabase, defina **Site URL** como `https://alcance.ia.br` e permita `https://alcance.ia.br/auth/callback` e `http://localhost:3000/auth/callback` em **Redirect URLs**.
7. O Client ID pode ser salvo em **Admin → Integrações → Google**; `NEXT_PUBLIC_GOOGLE_CLIENT_ID` permanece como fallback de ambiente.
8. Teste botão, One Tap, FedCM, OAuth, logout e cooldown nos navegadores suportados.

Nunca exponha o Client Secret. Configure-o em **Supabase Dashboard → Authentication → Providers → Google**. Revise CSP e COOP com a documentação oficial antes da produção.
