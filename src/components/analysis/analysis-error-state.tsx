import Link from "next/link";
import type { AnalysisState } from "@/lib/analysis/types";
const copy: Record<string, { eyebrow: string; title: string; message: string }> = {
  not_found: { eyebrow: "PERFIL NÃO ENCONTRADO", title: "Não localizamos esse perfil.", message: "Revise o nome informado. O perfil pode ter mudado de usuário ou não estar disponível publicamente." },
  private: { eyebrow: "PERFIL PRIVADO", title: "Este perfil não pode ser analisado.", message: "Contas privadas não oferecem publicamente as informações necessárias para calcular as métricas." },
  temporary_error: { eyebrow: "INSTABILIDADE TEMPORÁRIA", title: "Não foi possível concluir agora.", message: "O Instagram ou nosso fornecedor de dados pode estar temporariamente indisponível. Tente novamente em alguns instantes." },
  unavailable: { eyebrow: "ANÁLISE INDISPONÍVEL", title: "A análise está temporariamente pausada.", message: "A configuração necessária não está disponível neste momento. Nenhum dado incorreto será exibido." },
};
export function AnalysisErrorState({ state }: { state: Extract<AnalysisState, "not_found" | "private" | "temporary_error" | "unavailable"> }) { const item = copy[state]; return <section className="analysis-state-card"><span className="eyebrow">{item.eyebrow}</span><div className="analysis-state-icon" aria-hidden="true">{state === "private" ? "◇" : "!"}</div><h1>{item.title}</h1><p>{item.message}</p><Link className="button" href="/#analisar">Tentar outro perfil</Link></section>; }
