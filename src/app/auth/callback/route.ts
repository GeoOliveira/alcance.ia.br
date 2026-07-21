import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { safeUserRedirect } from "@/lib/auth/redirect";
export async function GET(request:Request){const url=new URL(request.url);const code=url.searchParams.get("code");const next=safeUserRedirect(url.searchParams.get("next"));if(!code)return NextResponse.redirect(new URL("/entrar?erro=callback",url.origin));try{const supabase=await createClient();const{error}=await supabase.auth.exchangeCodeForSession(code);if(error)return NextResponse.redirect(new URL("/entrar?erro=callback",url.origin));return NextResponse.redirect(new URL(next,url.origin))}catch{return NextResponse.redirect(new URL("/entrar?erro=callback",url.origin))}}
