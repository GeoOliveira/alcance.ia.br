"use client";

export default function TrendingReelsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="reels-trending-page"><section className="reels-trending-content"><div className="container"><div className="reels-trending-state is-error" role="alert"><span>!</span><h1>Não foi possível carregar a amostra pública</h1><p>Os dados de Reels continuam seguros. Tente novamente em alguns instantes.</p><button className="button" type="button" onClick={reset}>Tentar novamente</button></div></div></section></main>;
}
