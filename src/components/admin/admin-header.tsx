import { logoutAction } from "@/app/admin/actions/auth";
import { roleLabels } from "@/lib/admin/permissions";
import type { AdminSession } from "@/types/admin";
import { AdminMobileMenu } from "./admin-navigation";

export function AdminHeader({ session }: { session: AdminSession }) {
  return <header className="admin-header"><AdminMobileMenu role={session.profile.role} />
    <div><strong>{session.profile.display_name}</strong><span>{roleLabels[session.profile.role]}</span></div>
    {process.env.VERCEL_ENV && process.env.VERCEL_ENV !== "production" && <span className="admin-environment">{process.env.VERCEL_ENV}</span>}
    <form action={logoutAction}><button type="submit" className="admin-secondary-button">Sair</button></form>
  </header>;
}
