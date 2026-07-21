import type { NextRequest } from "next/server";
import { updateAdminSession, updateUserSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return request.nextUrl.pathname.startsWith("/admin") ? updateAdminSession(request) : updateUserSession(request);
}

export const config = { matcher: ["/admin/:path*", "/painel/:path*", "/entrar", "/criar-conta", "/recuperar-senha", "/redefinir-senha", "/verifique-seu-email", "/auth/callback"] };
