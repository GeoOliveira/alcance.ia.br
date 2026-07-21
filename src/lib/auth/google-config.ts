import "server-only";
import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";

type GoogleSettingRow={key:string;value:unknown};

export const getGoogleAuthPublicConfig=unstable_cache(async()=>{
  const fallback=process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim()||"";
  const client=createAdminClient();
  if(!client)return{clientId:fallback,source:fallback?"environment" as const:"missing" as const};
  const{data,error}=await client.from("app_settings").select("key,value").eq("key","auth.google_client_id").maybeSingle();
  if(error)return{clientId:fallback,source:fallback?"environment" as const:"missing" as const};
  const row=data as GoogleSettingRow|null;
  const stored=typeof row?.value==="string"?row.value.trim():"";
  return{clientId:stored||fallback,source:stored?"admin" as const:fallback?"environment" as const:"missing" as const};
},["google-auth-public-config-v1"],{tags:["public-settings","google-auth-config"],revalidate:300});

export const getSupabaseGoogleProviderStatus=unstable_cache(async()=>{
  const url=process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if(!url||!key)return{available:false,enabled:false};
  try{
    const response=await fetch(`${url.replace(/\/$/,"")}/auth/v1/settings`,{headers:{apikey:key},signal:AbortSignal.timeout(5000)});
    if(!response.ok)return{available:false,enabled:false};
    const data=await response.json() as {external?:{google?:boolean}};
    return{available:true,enabled:data.external?.google===true};
  }catch{return{available:false,enabled:false}}
},["supabase-google-provider-status-v1"],{tags:["google-auth-config"],revalidate:60});
