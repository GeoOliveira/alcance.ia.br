import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
export default function robots():MetadataRoute.Robots{return {rules:{userAgent:"*",allow:"/",disallow:["/api/","/admin/","/painel/","/analisar/","/resultado","/login","/cadastro","/entrar","/criar-conta","/recuperar-senha","/redefinir-senha","/verifique-seu-email","/verificar-email","/obrigado"]},sitemap:`${siteConfig.url}/sitemap.xml`,host:siteConfig.url}}
