import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/forms/signup-form";
import { Container } from "@/components/ui/container";
export const metadata:Metadata={title:"Cadastro",description:"Demonstração do futuro registro de interesse da Alcance IA.",alternates:{canonical:"/cadastro"},robots:{index:false,follow:false}};
export default function Page(){return <main className="content-section"><Container className="two-column"><div><span className="eyebrow">ACESSO ANTECIPADO</span><h1 style={{fontSize:"52px",letterSpacing:"-.05em",lineHeight:1.05}}>Acompanhe os próximos passos da Alcance IA.</h1><p>O formulário demonstra como será o registro de interesse, mas o envio e a autenticação ainda não estão ativos nesta fase.</p><div className="bullet-list"><span>✓ Nenhuma senha solicitada</span><span>✓ Consentimentos separados</span><span>✓ Nenhum dado salvo nesta fase</span></div><p>A área de acesso ainda está em preparação. <Link className="arrow-link" href="/login">Saiba mais</Link></p></div><div className="form-shell"><SignupForm /></div></Container></main>}
