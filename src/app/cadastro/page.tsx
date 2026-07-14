import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/forms/signup-form";
import { Container } from "@/components/ui/container";
export const metadata:Metadata={title:"Cadastro",description:"Registre interesse na conta gratuita Alcance IA.",robots:{index:false,follow:false}};
export default function Page(){return <main className="content-section"><Container className="two-column"><div><span className="eyebrow">ACESSO ANTECIPADO</span><h1 style={{fontSize:"52px",letterSpacing:"-.05em",lineHeight:1.05}}>Sua conta Alcance IA começa aqui.</h1><p>Registre seu interesse para ser avisado quando a análise completa estiver disponível. A autenticação ainda não está ativa nesta fase.</p><div className="bullet-list"><span>✓ Sem senha do Instagram</span><span>✓ Consentimentos separados</span><span>✓ Estrutura pronta para Supabase Auth</span></div><p>Já se cadastrou? <Link className="arrow-link" href="/login">Entrar</Link></p></div><div className="form-shell"><SignupForm /></div></Container></main>}
