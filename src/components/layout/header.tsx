import { AnalyticsLink } from "@/components/analytics/analytics-link";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";
import { mainNavigation } from "@/config/site";
import { MobileMenu } from "./mobile-menu";

export function Header() {
  return <header className="site-header"><Container className="header-inner"><Logo />
    <nav className="desktop-nav" aria-label="Navegação principal">{mainNavigation.map((item) => <AnalyticsLink key={item.href} href={item.href} eventName="navigation_clicked" properties={{ navigation_target: item.href, cta_location: "header" }}>{item.label}</AnalyticsLink>)}</nav>
    <div className="header-actions"><AnalyticsLink className="text-link" href="/login" eventName="login_clicked" properties={{ cta_location: "header" }}>Entrar</AnalyticsLink><AnalyticsLink className="button button-small" href="/#analisar" eventName="navigation_clicked" properties={{ navigation_target: "/#analisar", cta_location: "header" }}>Analisar perfil</AnalyticsLink></div>
    <MobileMenu />
  </Container></header>;
}
