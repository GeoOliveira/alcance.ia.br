import type { Metadata } from "next";
import { siteConfig } from "@/config/site";

export const globalSeoDefaults: Metadata = {
  title: "Alcance IA — análise inteligente para Instagram",
  description: siteConfig.description,
  openGraph: {
    type: "website", locale: "pt_BR", siteName: siteConfig.name,
    title: "Alcance IA", description: siteConfig.description,
    images: [{ url: "/og.png", width: 1731, height: 909, alt: "Alcance IA — entenda seu perfil, amplie suas possibilidades" }],
  },
  twitter: { card: "summary_large_image", title: "Alcance IA", description: siteConfig.description, images: ["/og.png"] },
};
