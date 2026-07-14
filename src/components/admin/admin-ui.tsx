import Link from "next/link";

export function AdminStatCard({ label, value, detail }: { label: string; value: number | string; detail?: string }) {
  return <article className="admin-stat-card"><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</article>;
}

export function AdminEmptyState({ title, message }: { title: string; message: string }) {
  return <div className="admin-empty"><strong>{title}</strong><p>{message}</p></div>;
}

export function AdminStatusBadge({ status }: { status: string }) {
  return <span className={`admin-status admin-status-${status.replace(/[^a-z_]/g, "")}`}>{status.replaceAll("_", " ")}</span>;
}

export function AdminPagination({ page, totalPages, baseUrl, query = "" }: { page: number; totalPages: number; baseUrl: string; query?: string }) {
  if (totalPages <= 1) return null;
  const suffix = query ? `&${query}` : "";
  return <nav className="admin-pagination" aria-label="Paginação">
    {page > 1 ? <Link href={`${baseUrl}?page=${page - 1}${suffix}`}>Anterior</Link> : <span />}
    <span>Página {page} de {totalPages}</span>
    {page < totalPages ? <Link href={`${baseUrl}?page=${page + 1}${suffix}`}>Próxima</Link> : <span />}
  </nav>;
}

export function AdminPageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="admin-page-header"><div><span>{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}
