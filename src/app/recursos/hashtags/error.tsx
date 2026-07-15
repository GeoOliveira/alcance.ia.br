"use client";

export default function HashtagsError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="hashtags-page"><section className="hashtags-content"><div className="container"><div className="hashtags-state is-error" role="alert"><span>!</span><h1>Não foi possível carregar as hashtags</h1><p>O restante do site continua disponível. Tente novamente em alguns instantes.</p><button className="button" type="button" onClick={reset}>Tentar novamente</button></div></div></section></main>;
}
