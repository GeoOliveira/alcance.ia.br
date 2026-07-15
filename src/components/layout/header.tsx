import { AnalyticsLink } from "@/components/analytics/analytics-link";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";
import { mainNavigation, resourceNavigation } from "@/config/site";
import { MobileMenu } from "./mobile-menu";

export function Header() {
  return <header className="site-header"><Container className="header-inner"><Logo />
    <nav className="desktop-nav" aria-label="Navegação principal"><AnalyticsLink href={mainNavigation[0].href} eventName="navigation_clicked" properties={{ navigation_target: mainNavigation[0].href, cta_location: "header" }}>{mainNavigation[0].label}</AnalyticsLink><details className="public-resources-menu"><summary>Recursos <span aria-hidden="true">⌄</span></summary><div className="public-resources-dropdown"><header><span>FERRAMENTAS</span><strong>Recursos da Alcance IA</strong></header><AnalyticsLink className="public-resource-overview" href="/recursos" eventName="navigation_clicked" properties={{ navigation_target: "/recursos", cta_location: "header_resources" }}>Ver todos os recursos <span aria-hidden="true">→</span></AnalyticsLink>{resourceNavigation.map((item) => <AnalyticsLink key={item.href} href={item.href} eventName="navigation_clicked" properties={{ navigation_target: item.href, cta_location: "header_resources" }}><strong>{item.label}</strong><small>{item.description}</small></AnalyticsLink>)}</div></details><AnalyticsLink href={mainNavigation[1].href} eventName="navigation_clicked" properties={{ navigation_target: mainNavigation[1].href, cta_location: "header" }}>{mainNavigation[1].label}</AnalyticsLink></nav>
    <div className="header-actions"><AnalyticsLink className="text-link" href="/login" eventName="login_clicked" properties={{ cta_location: "header" }}>Entrar</AnalyticsLink><AnalyticsLink className="button button-small" href="/#analisar" eventName="navigation_clicked" properties={{ navigation_target: "/#analisar", cta_location: "header" }}>Analisar perfil</AnalyticsLink></div>
    <MobileMenu />
  </Container></header>;
}
