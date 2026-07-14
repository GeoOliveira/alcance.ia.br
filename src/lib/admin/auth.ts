import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasPermission } from "@/lib/admin/permissions";
import type { AdminPermission, AdminProfile, AdminSession } from "@/types/admin";

export class AdminAuthorizationError extends Error {
  constructor(public readonly code: "unauthenticated" | "forbidden" = "forbidden") {
    super(code === "unauthenticated" ? "Authentication required" : "Insufficient permission");
  }
}

export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user?.email) return null;
    const { data, error: profileError } = await supabase
      .from("admin_profiles")
      .select("id,user_id,display_name,role,is_active,created_at,updated_at,created_by,last_login_at")
      .eq("user_id", user.id)
      .maybeSingle();
    if (profileError || !data?.is_active) return null;
    return { userId: user.id, email: user.email, profile: data as AdminProfile };
  } catch {
    return null;
  }
});

export async function requireAdminSession(permission?: AdminPermission) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (permission && !hasPermission(session.profile.role, permission)) redirect("/admin?erro=permissao");
  return session;
}

export async function authorizeAdminAction(permission: AdminPermission) {
  const session = await getAdminSession();
  if (!session) throw new AdminAuthorizationError("unauthenticated");
  if (!hasPermission(session.profile.role, permission)) {
    try {
      const supabase = await createClient();
      await supabase.rpc("admin_write_audit", {
        p_action: "admin_authorization_denied",
        p_entity_type: "admin_permission",
        p_entity_id: permission,
        p_before_data: null,
        p_after_data: null,
        p_metadata: { role: session.profile.role },
        p_request_id: null,
      });
    } catch {
      // Authorization remains denied even if audit storage is unavailable.
    }
    throw new AdminAuthorizationError("forbidden");
  }
  return session;
}
