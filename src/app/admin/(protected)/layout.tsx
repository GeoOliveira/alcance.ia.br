import { requireAdminSession } from "@/lib/admin/auth";
import { AdminSidebar } from "@/components/admin/admin-navigation";
import { AdminHeader } from "@/components/admin/admin-header";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession();
  return <div className="admin-shell"><AdminSidebar role={session.profile.role} /><div className="admin-workspace">
    <AdminHeader session={session} /><main className="admin-main"><AdminBreadcrumbs />{children}</main>
  </div></div>;
}
