# Criação do primeiro superadministrador

Não existe cadastro administrativo público. O bootstrap exige uma conta já criada no Supabase Auth e uma inserção manual autenticada no painel do Supabase.

## 1. Criar ou localizar o usuário Auth

No projeto correto, abra **Authentication → Users**. Crie o usuário do proprietário com e-mail verificado e senha temporária forte, ou selecione um usuário existente. Copie o UUID da coluna `id`. Não copie token, senha ou chave.

## 2. Associar o perfil

Após aplicar `202607140003_admin_panel.sql`, abra o SQL Editor do Supabase e execute, substituindo somente os dois valores indicados:

```sql
insert into public.admin_profiles (user_id, display_name, role, is_active)
values (
  'UUID_DO_USUARIO_AUTH'::uuid,
  'NOME_DE_EXIBICAO',
  'super_admin',
  true
);
```

O procedimento é manual porque não há `super_admin` capaz de autorizar o primeiro registro. Não transforme esse SQL em endpoint, Server Action pública ou seed com e-mail fixo.

## 3. Validar

1. Acesse `/admin/login`.
2. Entre com o usuário criado.
3. Confirme nome e função no cabeçalho.
4. Verifique `last_login_at` e o evento `admin_login_succeeded`.
5. Troque a senha temporária pelo fluxo de recuperação.
6. Teste logout e novo login.

## Novos administradores

Crie primeiro a conta no Supabase Auth. Um `super_admin` pode então associar o UUID em `/admin/usuarios` com função `admin`, `editor`, `support` ou `analyst`. A interface não concede `super_admin`; promoções desse nível continuam sendo uma operação manual excepcional e auditada por processo organizacional.

Nunca desative o último `super_admin`. O banco bloqueia a operação e a exclusão física de perfis administrativos. Mantenha ao menos duas contas privilegiadas de pessoas distintas após ativar MFA.
