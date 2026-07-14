"use client";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <div className="admin-error-state"><h1>Não foi possível carregar esta área</h1><p>A sessão pode ter expirado ou o serviço está temporariamente indisponível.</p><button className="admin-primary-button" onClick={reset}>Tentar novamente</button></div>;
}
