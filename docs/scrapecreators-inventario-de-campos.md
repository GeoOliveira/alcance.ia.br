# Inventário de campos da ScrapeCreators

Documento vivo. Frequência e confiabilidade devem ser atualizadas após uma amostra real; nenhuma chamada real foi feita durante a implementação por ausência intencional de chave versionada.

| Endpoint | Campo original | Tipo observado/documentado | Frequência atual | Campo normalizado | Observação | Confiabilidade | Exemplo sanitizado | Utilidade futura |
|---|---|---|---|---|---|---|---|---|
| Perfil | `data.user.username` | string | a medir | `username` | identificador público | alta/documental | `perfil_teste` | identificação |
| Perfil | `data.user.edge_followed_by.count` ou `follower_count` | number | a medir | `followersCount` | formatos variam | média | `1200` | contexto de porte |
| Perfil | `data.user.is_private` | boolean | a medir | `isPrivate` | determina viabilidade | alta/documental | `false` | elegibilidade |
| Posts | `items[].code` | string | a medir | `shortcode` | cursor em `next_max_id` | alta/documental | `ABC123` | detalhe/permalink |
| Posts | `items[].caption.text` | string/null | a medir | `caption` | pode faltar | média | `Legenda #tema` | texto futuro |
| Posts | `items[].like_count` | number/null | a medir | `likeCount` | ausência não vira zero | média | `42` | métrica futura |
| Reels | `items[].media.play_count` | number/null | a medir | `playCount` | pode divergir do total IG+FB | baixa/média | `2500` | estudo técnico |
| Reels | `paging_info.max_id` | string/null | a medir | cursor técnico | não exposto no contrato de post | média | `[cursor]` | paginação |
| Detalhe | `data.xdt_shortcode_media.shortcode` | string | a medir | `shortcode` | foto/Reel/carrossel | alta/documental | `ABC123` | correlação |
| Detalhe | `data.xdt_shortcode_media.edge_sidecar_to_children` | object/null | a medir | `isCarousel`, `carouselItemsCount` | estrutura pode variar | média | `{ "edges": [] }` | formato |

As exportações CSV de cada execução fornecem a base para atualizar presença, nulos, desconhecidos e inconsistências sem copiar dados pessoais ou URLs assinadas para este documento.
