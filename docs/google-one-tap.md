# Google One Tap e FedCM

A mesma inicialização GIS atende botão e One Tap uma vez por página. O código usa FedCM, aplica cooldown local de 24 horas após dispensa/logout e não mostra erro quando o prompt apenas não aparece.

Para cada inicialização, 32 bytes aleatórios formam o nonce original. O SHA-256 hexadecimal é enviado ao Google; o original é enviado ao Supabase. O token não é persistido. Não habilite em páginas administrativas ou para usuários autenticados.
