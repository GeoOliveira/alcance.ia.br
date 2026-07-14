import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
export const metadata:Metadata={title:"Obrigado",robots:{index:false,follow:false}};
export default function Page(){return <main className="content-section"><Container><div className="success-state"><span>✓</span><h1>Obrigado por acompanhar a Alcance IA.</h1><p>Seu interesse ajuda a orientar os próximos passos da plataforma.</p><Link className="button" href="/">Voltar ao início</Link></div></Container></main>}
