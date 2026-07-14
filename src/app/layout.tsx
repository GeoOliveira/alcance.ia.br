import { Suspense } from "react";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CookieBanner } from "@/components/cookies/cookie-banner";
import { AnalyticsLoader } from "@/components/analytics/analytics-loader";
import { ApplicationShell } from "@/components/layout/application-shell";
import { getPublicSettings } from "@/lib/settings/get-settings";
import { getPublicFlags } from "@/lib/settings/public-content";
import { isMaintenanceMode } from "@/lib/settings/availability";
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

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [settings, flags] = await Promise.all([getPublicSettings(), getPublicFlags()]);
  const deploymentEnvironment = process.env.VERCEL_ENV || (process.env.NODE_ENV === "production" ? "production" : "development");
  const analyticsAllowed = settings.analyticsEnvironment === "all" || settings.analyticsEnvironment === deploymentEnvironment;
  const structuredData = [{ "@context": "https://schema.org", "@type": "Organization", name: siteConfig.name, url: siteConfig.url }, { "@context": "https://schema.org", "@type": "WebSite", name: siteConfig.name, url: siteConfig.url, inLanguage: "pt-BR" }];
  return <html lang="pt-BR"><body className={`${geist.variable} ${mono.variable}`}><ApplicationShell
    header={<Header />} footer={<Footer />} cookieBanner={<CookieBanner />}
    analytics={<Suspense fallback={null}><AnalyticsLoader gaId={analyticsAllowed && settings.ga4Enabled ? settings.ga4MeasurementId : ""} clarityId={analyticsAllowed && settings.clarityEnabled ? settings.clarityProjectId : ""} /></Suspense>}
    structuredData={<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />}
    maintenance={{ enabled: isMaintenanceMode(settings, flags), title: settings.maintenanceTitle, message: settings.maintenanceMessage, contactEmail: settings.contactEmail }}
  >{children}</ApplicationShell></body></html>;
}
