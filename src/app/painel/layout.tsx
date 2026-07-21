import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/ui/logo";
import { PanelShell } from "@/components/whatsapp-manager/panel-shell";
import { requireUser } from "@/lib/auth/user";
import { getWhatsAppManagerRuntime } from "@/lib/whatsapp-manager/runtime";
import "./panel.css";

export default async function PanelLayout({ children }: { children: ReactNode }) {
  const [user, runtime] = await Promise.all([requireUser(), getWhatsAppManagerRuntime()]);
  if (!runtime.enabled) return <main className="panel-disabled"><Logo/><div><span>RECURSO DESATIVADO</span><h1>O gerenciador ainda não está disponível.</h1><p>A ativação depende das migrations, configuração do Supabase, Google e Encurta.io, além da validação de segurança.</p><Link href="/recursos/gerenciador-links-whatsapp">Voltar para a página do recurso</Link></div></main>;

  const name = String(user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split("@")[0] || "Conta");

  return <PanelShell name={name} email={user.email || "Conta gratuita"}>{children}</PanelShell>;
}
