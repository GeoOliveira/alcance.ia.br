# Menu administrativo de conteúdo

O menu lateral agrupa `Páginas`, `Perguntas e respostas` e `Conteúdo Home`. O grupo é expansível por botão nativo, expõe `aria-expanded`, abre automaticamente quando uma rota filha está ativa e funciona no menu móvel.

As opções são filtradas por permissão, mas isso é apenas conveniência visual: cada página e cada Server Action repete autenticação e autorização no servidor. `super_admin`, `admin` e `editor` acessam SEO, FAQ e Home. `support` e `analyst` não possuem escrita de conteúdo.
