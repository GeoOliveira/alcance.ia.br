import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeAdminRedirect } from "@/lib/admin/validation";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const destination = safeAdminRedirect(request.nextUrl.searchParams.get("next") || "/admin");
  if (code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(destination, request.url));
    } catch { /* retorno genérico abaixo */ }
  }
  return NextResponse.redirect(new URL("/admin/login?erro=link", request.url));
}
