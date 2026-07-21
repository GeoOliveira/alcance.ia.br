import "server-only";
import { cache } from "react";
import { getPublicFlags } from "@/lib/settings/public-content";
const defaults={resource_whatsapp_link_manager:false,encurta_integration:false,whatsapp_manager_registration:true,whatsapp_manager_password_login:true,whatsapp_manager_google_login:false,whatsapp_manager_google_one_tap:false,whatsapp_manager_create_link:true,whatsapp_manager_qr_code:true,whatsapp_manager_click_metrics:true,whatsapp_manager_edit_link:true,whatsapp_manager_expiration:true,whatsapp_manager_export:false,whatsapp_manager_custom_slug:false,whatsapp_manager_advanced_analytics:false} as const;
export const getWhatsAppManagerRuntime=cache(async()=>{const persisted=await getPublicFlags();const flags=Object.fromEntries(Object.entries(defaults).map(([key,fallback])=>[key,persisted[key]??fallback])) as Record<keyof typeof defaults,boolean>;return{flags,enabled:flags.resource_whatsapp_link_manager&&flags.encurta_integration}});
