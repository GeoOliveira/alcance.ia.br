import { NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/auth/email-verification";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const verified = await verifyEmailToken(url.searchParams.get("token") || "");
  return NextResponse.redirect(new URL(verified ? "/painel?email=verificado" : "/entrar?email=link-invalido", url.origin));
}
