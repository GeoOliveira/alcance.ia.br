import type { MetadataRoute } from "next";
import { siteConfig } from "@/config/site";
const paths=["","/como-funciona","/recursos","/quem-somos","/contato","/politica-de-privacidade","/termos-de-uso","/politica-de-cookies","/exclusao-de-dados"];
export default function sitemap():MetadataRoute.Sitemap{return paths.map((path)=>({url:`${siteConfig.url}${path}`,lastModified:new Date("2026-07-13"),changeFrequency:path?"monthly":"weekly",priority:path?0.7:1}))}
