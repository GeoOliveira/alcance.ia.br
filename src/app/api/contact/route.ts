import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/validation/forms";
import { createAdminClient } from "@/lib/supabase/admin";
import { checkRateLimit, requestFingerprint } from "@/lib/security/rate-limit";

export async function POST(request: Request) {
  const limit=checkRateLimit(`${requestFingerprint(request)}:contact`,3,10*60_000);
  if(!limit.allowed)return NextResponse.json({error:"Limite de mensagens atingido. Tente novamente mais tarde."},{status:429,headers:{"Retry-After":String(limit.retryAfter)}});
  try{const body=await request.json();const parsed=contactSchema.safeParse(body);if(!parsed.success)return NextResponse.json({error:parsed.error.issues[0]?.message||"Revise os campos."},{status:400});if(parsed.data.website)return NextResponse.json({ok:true},{status:201});const admin=createAdminClient();if(!admin)return NextResponse.json({error:"O canal de contato ainda não está conectado. Configure o Supabase para receber mensagens."},{status:503});const {name,email,subject,message}=parsed.data;const {error}=await admin.from("contact_messages").insert({name,email,subject,message,privacy_accepted_at:new Date().toISOString(),status:"new"});if(error){console.error("contact_insert_failed",{code:error.code});return NextResponse.json({error:"Não foi possível registrar a mensagem."},{status:500})}
    if(process.env.RESEND_API_KEY&&process.env.CONTACT_EMAIL){await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${process.env.RESEND_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({from:"Alcance IA <onboarding@resend.dev>",to:[process.env.CONTACT_EMAIL],subject:`Contato Alcance IA: ${subject}`,text:`Nome: ${name}\nE-mail: ${email}\n\n${message}`})}).catch(()=>undefined)}return NextResponse.json({ok:true},{status:201})}catch{return NextResponse.json({error:"Solicitação inválida."},{status:400})}
}
