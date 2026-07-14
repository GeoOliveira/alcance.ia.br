import { AdminRecoveryForm, AdminUpdatePasswordForm } from "@/components/admin/admin-auth-form";
import { getAdminSession } from "@/lib/admin/auth";

export default async function RecoveryPage() {
  const session = await getAdminSession();
  return <main className="admin-auth-page"><section className="admin-auth-card">
    <span className="admin-kicker">SEGURANÇA</span><h1>{session ? "Defina uma nova senha" : "Recuperar acesso"}</h1>
    <p>{session ? "Use uma senha exclusiva com pelo menos 12 caracteres." : "As instruções serão enviadas apenas quando houver uma conta válida."}</p>
    {session ? <AdminUpdatePasswordForm /> : <AdminRecoveryForm />}
  </section></main>;
}
