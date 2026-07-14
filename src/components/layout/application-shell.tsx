"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const legalPaths = ["/politica-de-privacidade", "/politica-de-cookies", "/termos-de-uso", "/exclusao-de-dados"];

export function ApplicationShell({ children, header, footer, cookieBanner, analytics, structuredData, maintenance }: {
  children: React.ReactNode; header: React.ReactNode; footer: React.ReactNode; cookieBanner: React.ReactNode;
  analytics: React.ReactNode; structuredData: React.ReactNode;
  maintenance: { enabled: boolean; title: string; message: string; contactEmail: string };
}) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return <>{children}</>;
  if (maintenance.enabled && !legalPaths.includes(pathname)) {
    return <main className="maintenance-page"><section><span>ALCANCE IA</span><h1>{maintenance.title}</h1><p>{maintenance.message}</p><Link href={`mailto:${maintenance.contactEmail}`}>Entrar em contato</Link></section></main>;
  }
  return <><a className="skip-link" href="#conteudo">Pular para o conteúdo</a>{header}<div id="conteudo">{children}</div>{footer}{cookieBanner}{analytics}{structuredData}</>;
}
