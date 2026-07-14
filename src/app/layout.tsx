import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CookieBanner } from "@/components/cookies/cookie-banner";
import { AnalyticsLoader } from "@/components/analytics/analytics-loader";
import { siteConfig } from "@/config/site";
import "./globals.css";

const geist = Geist({ variable: "--font-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: "Alcance IA — análise inteligente para Instagram", template: "%s | Alcance IA" },
  description: siteConfig.description,
  alternates: { canonical: "/" },
  openGraph: { type: "website", locale: "pt_BR", siteName: siteConfig.name, title: "Alcance IA", description: siteConfig.description, url: "/", images: [{ url: "/og.png", width: 1731, height: 909, alt: "Alcance IA — entenda seu perfil, amplie suas possibilidades" }] },
  twitter: { card: "summary_large_image", title: "Alcance IA", description: siteConfig.description, images: ["/og.png"] },
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = { themeColor: "#f7f8f5", colorScheme: "light" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const structuredData = [{ "@context": "https://schema.org", "@type": "Organization", name: siteConfig.name, url: siteConfig.url }, { "@context": "https://schema.org", "@type": "WebSite", name: siteConfig.name, url: siteConfig.url, inLanguage: "pt-BR" }];
  return <html lang="pt-BR"><body className={`${geist.variable} ${mono.variable}`}><a className="skip-link" href="#conteudo">Pular para o conteúdo</a><Header /><div id="conteudo">{children}</div><Footer /><CookieBanner /><AnalyticsLoader /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} /></body></html>;
}
