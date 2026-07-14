import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";
import { MobileMenu } from "./mobile-menu";
import { mainNavigation } from "@/config/site";

export function Header() {
  return <header className="site-header"><Container className="header-inner"><Logo />
    <nav className="desktop-nav" aria-label="Navegação principal">{mainNavigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}</nav>
    <div className="header-actions"><Link className="text-link" href="/login">Entrar</Link><Link className="button button-small" href="/#analisar">Analisar perfil</Link></div>
    <MobileMenu />
  </Container></header>;
}
