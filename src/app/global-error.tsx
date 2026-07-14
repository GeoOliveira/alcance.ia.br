"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics/track";

export default function GlobalError({ unstable_retry }: { error: Error & { digest?: string }; unstable_retry: () => void }) {
  useEffect(() => {
    trackEvent("client_error", { error_code: "global_render_error" });
  }, []);
  return <html lang="pt-BR"><body><main className="content-section"><div className="container content-narrow"><h1>Algo não saiu como esperado.</h1><p>Tente recarregar a experiência.</p><button className="button" type="button" onClick={() => unstable_retry()}>Tentar novamente</button></div></main></body></html>;
}
