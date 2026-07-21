import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { requestUserPasswordResetAction } from "../actions";
export const metadata:Metadata={title:"Recuperar senha | Alcance IA",robots:{index:false,follow:false}};
export default function RecoverPage(){return <main className="auth-notice"><span className="eyebrow">ACESSO</span><h1>Recupere sua senha</h1><p>Informe seu e-mail. A resposta não revela se há uma conta cadastrada.</p><AuthForm action={requestUserPasswordResetAction} mode="recover"/><p className="auth-switch"><Link href="/entrar">Voltar para entrar</Link></p></main>}
