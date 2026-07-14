"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/track";

export default function ErrorPage({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    trackEvent("client_error", {
      error_code: error.digest ? "render_error_with_digest" : "render_error",
      page_path: window.location.pathname,
    });
  }, [error]);

  return (
    <main className="content-section">
      <div className="container content-narrow">
        <div className="form-shell">
          <span className="eyebrow">ERRO INESPERADO</span>
          <h1>Não foi possível carregar esta área.</h1>
          <p>Tente novamente. Se o problema continuar, volte à página inicial.</p>
          <button className="button" type="button" onClick={() => unstable_retry()}>Tentar novamente</button>
        </div>
      </div>
    </main>
  );
}
