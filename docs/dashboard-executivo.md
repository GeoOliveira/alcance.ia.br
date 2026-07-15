# Dashboard Executivo da análise

O Dashboard Executivo aparece imediatamente depois de **Explorar relatório** e antes do resumo, das métricas, dos insights determinísticos e da interpretação assistida por IA. Ele resume dados que já fazem parte do resultado persistido; abrir a página não executa novas coletas, não consome créditos do provedor e não solicita uma nova interpretação por IA.

## Módulos iniciais

1. **Saúde do perfil:** radar de Bio, Engajamento, Frequência, Conteúdo, Hashtags e CTA. As dimensões são normalizações visuais de métricas existentes, em escala de 0 a 100.
2. **Desempenho das publicações recentes:** engajamento estimado por publicação, limitado às dez publicações mais recentes com data, interações e seguidores válidos.
3. **Distribuição de formatos:** quantidade observada de Reels, carrosséis e fotos.
4. **Reels com mais visualizações:** até cinco Reels ordenados pelas visualizações já armazenadas.
5. **Hashtags mais usadas:** até oito hashtags por frequência na amostra.
6. **Comparativo por formato:** médias observadas de curtidas, comentários e visualizações por formato.

Cada módulo trata separadamente dados insuficientes. A ausência de dados em um gráfico não oculta os demais módulos nem o restante do relatório. Módulos Premium podem permanecer visíveis como preview bloqueado, sem revelar dados protegidos.

## Controle administrativo

Em **Admin → Recursos → Dashboard Executivo**, o superadministrador pode alterar título, descrição, ícone, ordem numérica, mínimo de dados, estado, acesso, habilitação, visibilidade, requisitos de IA/autenticação/Premium e dependências. Mudanças críticas exigem a confirmação `ATIVAR` e todas as alterações são registradas na auditoria administrativa.

A tabela `dashboard_modules` é a fonte central de configuração. A ordem da página é sempre `display_order`; os componentes não possuem posições fixas no código. As flags `dashboard_enabled`, `dashboard_radar`, `dashboard_posts_chart`, `dashboard_formats_chart`, `dashboard_top_reels_chart`, `dashboard_hashtags_chart`, `dashboard_comparison_chart` e `dashboard_premium_preview` funcionam como controles adicionais de emergência.

## Estados e rastreamento

Os componentes oferecem estados de carregamento, erro, dados insuficientes, beta e Premium. Módulos desabilitados, ocultos ou em desenvolvimento não são expostos ao público. Os eventos registrados são abertura do dashboard, visualização de gráfico, visualização de preview Premium e clique no CTA Premium. Nenhum evento inclui nome de usuário, conteúdo do perfil ou outras informações pessoais.

