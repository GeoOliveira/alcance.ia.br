# Preparação para planos premium

Não há pagamento, assinatura ou cobrança. Um recurso premium habilitado em preview exibe descrição e CTA de interesse, mas não libera os detalhes. `feature_interest` guarda apenas a chave, sessão anônima ou usuário, origem e data, com deduplicação.

A futura camada de assinatura deverá fornecer o contexto `isPremium` à decisão central. Nenhum componente deverá consultar plano ou cobrança diretamente.
