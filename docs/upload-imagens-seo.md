# Upload de imagens SEO

O repositório ainda não possui bucket, políticas ou abstração de upload. Por isso o painel mostra o estado pendente e aceita temporariamente somente URL HTTPS absoluta. Base64, SVG e conteúdo binário no banco não são aceitos.

## Preparação recomendada

1. criar manualmente um bucket público `seo-images` após revisão de segurança;
2. restringir escrita a `super_admin`, `admin` e `editor` autenticados;
3. usar caminhos `seo-images/{page_key}/{uuid}.{ext}` sem permitir listagem pública ampla;
4. validar no servidor MIME, extensão JPG/JPEG/PNG/WebP, máximo de 2 MB, assinatura real da imagem e dimensões; recomendar 1200 × 630;
5. enviar o novo arquivo, atualizar a tabela e só então remover o anterior;
6. registrar upload, substituição e exclusão sem salvar binários na auditoria;
7. configurar retenção e limpeza de arquivos órfãos.

Depois da configuração, a interface pode habilitar upload, substituição, remoção, cópia da URL e dimensões. A URL armazenada deve ser pública e absoluta para Open Graph/Twitter. A migration atual deliberadamente não cria bucket nem políticas remotas.
