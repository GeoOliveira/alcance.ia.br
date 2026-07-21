import type { Metadata } from "next";
import { AuthForm } from "@/components/auth/auth-form";
import { updateUserPasswordAction } from "../actions";
export const metadata:Metadata={title:"Redefinir senha | Alcance IA",robots:{index:false,follow:false}};
export default function ResetPage(){return <main className="auth-notice"><h1>Defina uma nova senha</h1><p>Use uma senha segura e diferente das anteriores.</p><AuthForm action={updateUserPasswordAction} mode="reset"/></main>}
