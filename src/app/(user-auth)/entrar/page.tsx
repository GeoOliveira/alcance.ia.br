import type { Metadata } from "next";
import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { GoogleIdentity } from "@/components/auth/google-identity";
import { loginUserAction } from "../actions";
import { getWhatsAppManagerRuntime } from "@/lib/whatsapp-manager/runtime";
import { safeUserRedirect } from "@/lib/auth/redirect";
import { getGoogleAuthPublicConfig } from "@/lib/auth/google-config";
export const metadata:Metadata={title:"Entrar | Alcance IA",description:"Acesse seus links, QR Codes e métricas.",robots:{index:false,follow:false}};
export default async function EnterPage({searchParams}:{searchParams:Promise<{next?:string;senha?:string}>}){const[params,runtime,google]=await Promise.all([searchParams,getWhatsAppManagerRuntime(),getGoogleAuthPublicConfig()]);const next=safeUserRedirect(params.next);return <main className="auth-layout"><AuthVisual/><section className="auth-panel"><div className="auth-card"><span>ÁREA DO USUÁRIO</span><h1>Entre na sua conta</h1><p>Acesse seus links, QR Codes e métricas em um único painel.</p>{params.senha?<p className="auth-success">Senha atualizada. Entre com sua nova senha.</p>:null}<AuthForm action={loginUserAction} mode="login" next={next}/>{runtime.flags.whatsapp_manager_google_login?<><div className="auth-divider">ou continue com</div><GoogleIdentity enabled oneTap={runtime.flags.whatsapp_manager_google_one_tap} clientId={google.clientId}/></>:null}<p className="auth-switch">Ainda não tem conta? <Link href="/criar-conta">Criar conta</Link></p></div></section></main>}
function AuthVisual(){return <section className="auth-visual"><div><span>ALCANCE IA + ENCURTA.IO</span><h2>Seus links. Seu controle.</h2><p>Organize os canais de atendimento e acompanhe resultados sem acessar conversas ou enviar mensagens.</p></div><div className="auth-mini-dashboard"><header><span>Link de atendimento</span><span>Ativo</span></header><strong>encurta.io/Ab7xP2</strong><small>Demonstração · 248 cliques</small></div></section>}
