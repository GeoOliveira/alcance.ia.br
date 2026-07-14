import { AdminLoginForm } from "@/components/admin/admin-auth-form";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ next?: string; senha?: string; erro?: string }> }) {
  const query = await searchParams;
  return <main className="admin-auth-page"><section className="admin-auth-card">
    <span className="admin-kicker">ALCANCE IA</span><h1>Acesso administrativo</h1>
    <p>Entre com uma conta autorizada. Não existe cadastro público de administradores.</p>
    {query.senha === "atualizada" && <p className="admin-success">Senha atualizada. Entre novamente.</p>}
    {query.erro === "link" && <p className="admin-error">O link não é válido ou expirou.</p>}
    <AdminLoginForm next={query.next} />
  </section></main>;
}
