# Regras do plano de ação

O plano é determinístico, versionado junto das métricas e limitado por `analysis.maximum_action_items` (padrão 3, máximo validado 5). Cada item contém prioridade, categoria, evidência, ação, confiança e caminhos das métricas de origem. O motor aceita no máximo um item por categoria, ordena alta → média → baixa e não cria recomendação sem evidência.

| Regra | Prioridade | Evidência | Ação sugerida |
|---|---|---|---|
| completude abaixo de 65% | alta abaixo de 40%; senão média | score e critérios ausentes | completar os itens mostrados na seção |
| bio com intenção comercial e sem link | alta | bio normalizada + link ausente | adicionar destino confiável para contato ou catálogo |
| menos de 20% dos posts com CTA, com amostra disponível | média | percentual e tamanho da amostra | testar CTAs específicos em parte dos próximos conteúdos |
| regularidade irregular ou inatividade recente | alta para inatividade; senão média | posts em 30 dias e maior intervalo | retomar cadência proporcional ao próprio histórico |
| formato com maior engajamento médio não predominante | baixa | amostra mínima por formato e distribuição | ampliar o teste gradualmente e medir novamente |

Não há regras sobre “número ideal” universal de posts, volume ideal de hashtags ou superioridade automática de legenda longa/curta. O plano não promete resultado futuro. Regras futuras devem trazer teste unitário, limite de amostra, fonte de evidência e mecanismo contra contradição.
