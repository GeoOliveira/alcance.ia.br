import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/sections/page-hero";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = { title: "Análise de hashtags", description: "Metodologia da análise de hashtags da Alcance IA.", alternates: { canonical: "/recursos/hashtags" } };
export default function HashtagResourcePage() { return <main><PageHero eyebrow="HASHTAGS" title="Frequência e desempenho na amostra do perfil." description="A Alcance IA normaliza as hashtags das legendas já coletadas, remove duplicações no mesmo post e mantém associações descritivas sem afirmar causalidade." /><section className="content-section"><Container><div className="legal-notice"><strong>Sem consumo adicional</strong><p>O cálculo usa o snapshot da análise. São mostrados frequência, média, mediana, concentração e desempenho somente quando há amostra mínima.</p></div><Link className="button" href="/#analisar">Analisar meu perfil</Link></Container></section></main>; }
