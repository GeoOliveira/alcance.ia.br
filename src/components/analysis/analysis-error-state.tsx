import Link from "next/link";
import type { AnalysisState } from "@/lib/analysis/types";

const copy: Record<string, { eyebrow: string; title: string; message: string; icon: string; hint: string }> = {
  not_found: { eyebrow: "PERFIL NÃO ENCONTRADO", title: "Não localizamos esse perfil.", message: "Revise o nome informado. O perfil pode ter mudado de usuário ou não estar disponível publicamente.", icon: "?", hint: "Confira a grafia sem incluir espaços ou o símbolo @." },
  private: { eyebrow: "PERFIL PRIVADO", title: "Este perfil não pode ser analisado.", message: "Contas privadas não oferecem publicamente as informações necessárias para calcular as métricas.", icon: "◇", hint: "Você pode analisar outro perfil público a qualquer momento." },
  temporary_error: { eyebrow: "INSTABILIDADE TEMPORÁRIA", title: "Não foi possível concluir agora.", message: "O Instagram ou nosso fornecedor de dados pode estar temporariamente indisponível. Tente novamente em alguns instantes.", icon: "↻", hint: "Nenhuma cobrança ou resultado incompleto foi apresentado." },
  unavailable: { eyebrow: "ANÁLISE INDISPONÍVEL", title: "A análise está temporariamente pausada.", message: "A configuração necessária não está disponível neste momento. Nenhum dado incorreto será exibido.", icon: "!", hint: "Tente novamente mais tarde ou escolha outro perfil." },
};

export function AnalysisErrorState({ state }: { state: Extract<AnalysisState, "not_found" | "private" | "temporary_error" | "unavailable"> }) {
  const item = copy[state];
  return <section className="analysis-state-card" data-state={state}><div className="analysis-state-icon" aria-hidden="true">{item.icon}</div><span className="eyebrow">{item.eyebrow}</span><h1>{item.title}</h1><p>{item.message}</p><div className="analysis-state-hint">{item.hint}</div><div className="analysis-state-actions"><Link className="button" href="/#analisar">Tentar outro perfil</Link><Link className="button button-ghost" href="/">Voltar ao início</Link></div></section>;
}
