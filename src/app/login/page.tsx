import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
export const metadata:Metadata={title:"Entrar",description:"Acesso futuro à conta Alcance IA.",robots:{index:false,follow:false}};
export default function Page(){return <main className="content-section"><Container className="content-narrow"><div className="form-shell" style={{maxWidth:520,margin:"auto"}}><span className="eyebrow">ÁREA DE ACESSO</span><h1>Login em preparação</h1><p>A autenticação da Alcance IA será disponibilizada em uma fase futura. Nenhuma senha informada aqui é processada.</p><div className="security-note">Nunca use a senha do Instagram na Alcance IA.</div><Link className="button" href="/cadastro" style={{marginTop:20}}>Registrar interesse</Link></div></Container></main>}
