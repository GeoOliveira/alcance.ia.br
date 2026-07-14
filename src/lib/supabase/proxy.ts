import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const publicAdminPaths = ["/admin/login", "/admin/auth/callback", "/admin/recuperar-senha"];

export async function updateAdminSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const pathname = request.nextUrl.pathname;
  const isPublic = publicAdminPaths.some((path) => pathname.startsWith(path));

  if (!url || !key) return isPublic ? response : loginRedirect(request);

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (items) => {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        items.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return isPublic ? response : loginRedirect(request);

  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("is_active")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile?.is_active) {
    if (!isPublic) return loginRedirect(request);
    return response;
  }

  if (pathname === "/admin/login") {
    const destination = request.nextUrl.clone();
    destination.pathname = "/admin";
    destination.search = "";
    const redirectResponse = NextResponse.redirect(destination);
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie));
    return redirectResponse;
  }

  return response;
}

function loginRedirect(request: NextRequest) {
  const destination = request.nextUrl.clone();
  destination.pathname = "/admin/login";
  destination.search = "";
  if (request.nextUrl.pathname !== "/admin") {
    destination.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  }
  return NextResponse.redirect(destination);
}
