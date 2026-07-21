"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
export async function updateAccountAction(formData:FormData){const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)return;const displayName=String(formData.get("display_name")||"").trim().slice(0,120);const marketing=formData.get("marketing")==="on";await supabase.from("user_profiles").update({display_name:displayName,marketing_consent:marketing}).eq("user_id",user.id);await supabase.auth.updateUser({data:{name:displayName}});await supabase.from("user_activity_logs").insert({user_id:user.id,action:"account_updated",metadata:{}});revalidatePath("/painel/conta")}
