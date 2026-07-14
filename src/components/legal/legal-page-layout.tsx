import type { ReactNode } from "react";
import { EventTracker } from "@/components/analytics/event-tracker";
import { Container } from "@/components/ui/container";

export function LegalPageLayout({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <main>
      <EventTracker name="legal_page_viewed" />
      <section className="page-hero legal-hero">
        <Container>
          <span className="eyebrow">Transparência e confiança</span>
          <h1>{title}</h1>
          <p>{intro}</p>
          <div className="legal-meta">Versão inicial • Atualizada em 14 de julho de 2026</div>
        </Container>
      </section>
      <Container className="legal-layout">
        <aside>
          <strong>Neste documento</strong>
          <a href="#documento">Conteúdo principal</a>
          <a href="#contato-legal">Contato e direitos</a>
        </aside>
        <article id="documento" className="legal-content">
          {children}
          <div className="legal-notice">
            <strong>Revisão jurídica necessária</strong>
            <p>Este documento é uma versão inicial informativa e deve ser revisado por profissional jurídico antes da operação comercial definitiva.</p>
          </div>
        </article>
      </Container>
    </main>
  );
}
