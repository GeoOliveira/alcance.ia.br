# Gerenciamento de SEO no painel

A rota protegida `/admin/conteudo/paginas` edita metadata para um catálogo fechado definido em `src/lib/seo/page-catalog.ts`. Não é possível criar rotas, HTML, scripts ou JSON-LD pelo painel.

## Precedência e segurança

1. valor válido de `page_seo_settings`;
2. padrão da página no catálogo;
3. padrão global da aplicação.

A leitura ocorre uma única vez na camada `src/lib/seo`, usa cache com a tag `page-seo` e falha de forma segura quando o Supabase ou a migration não está disponível. O salvamento exige `seo.manage`, valida novamente todos os campos no servidor, registra `page_seo_updated`, expira a tag e revalida a rota pública.

Campos: título (70), descrição (180), até 20 palavras-chave, título OG (90), descrição OG (220), URL HTTPS de imagem, canonical HTTPS, indexação e seguimento de links. Campos vazios restauram o fallback. Recursos públicos ainda combinam o valor administrativo com suas barreiras operacionais: uma funcionalidade indisponível nunca se torna indexável apenas pelo SEO.

## Geração de conteúdo por IA

Cada página oferece **Gerar conteúdo** para criar um rascunho de Meta título, Meta descrição, Meta tags, Título Open Graph e Descrição Open Graph. A sugestão é exibida ao lado do conteúdo atual e somente altera o formulário depois de **Aplicar ao formulário**; o salvamento continua sendo uma ação humana separada.

O prompt de produção permanece versionado no código. As configurações `ai.seo_*` guardam voz global, termos preferenciais ou proibidos, cache e limite diário. A tabela `page_seo_ai_briefs` guarda apenas a orientação complementar de cada página. Conteúdo do briefing é tratado como dado não confiável, a saída usa Structured Outputs e passa novamente pelo schema e sanitizador locais.

A geração exige `seo.ai.generate`, concedida a `super_admin`, `admin` e `editor`. As execuções são registradas em `ai_seo_generation_runs` com modelo, versões, tokens, duração e erros sanitizados; a resposta bruta do provedor e segredos não são armazenados.

## Migration

Revise e aplique localmente `supabase/migrations/202607160019_admin_seo_and_home_privacy.sql`. Ela cria a tabela, constraints, índices, trigger, RLS e seeds idempotentes. Não sobrescreve metadata existente e não deve ser aplicada remotamente sem autorização.

Para a geração por IA, aplique também `supabase/migrations/202607160020_ai_seo_generation.sql`. A configuração mestre `ai.enabled` e as variáveis `OPENAI_API_KEY` e `OPENAI_MODEL` continuam obrigatórias.
