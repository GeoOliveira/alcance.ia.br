import Image from "next/image";
import Link from "next/link";
import { AnalyticsLink } from "@/components/analytics/analytics-link";
import { formatDateTime } from "@/lib/analysis/analysis-formatters";
import type { AnalysisViewModel } from "@/lib/analysis/types";

export function AnalysisHeader({ analysis }: { analysis: AnalysisViewModel }) {
  const profile = analysis.profile;
  const stateLabel = analysis.state === "partial" ? "Resultado parcial" : analysis.state === "insufficient_data" ? "Amostra reduzida" : "Análise concluída";

  return <header className="analysis-report-header">
    <div className="analysis-report-actions"><Link href="/">← Voltar</Link><AnalyticsLink href="/#analisar" eventName="analysis_refresh_clicked" properties={{ request_id: analysis.requestId, cta_location: "analysis_header" }}>Nova análise</AnalyticsLink></div>
    <div className="analysis-identity">
      <div className="analysis-avatar-ring">{profile?.profileImageUrl ? <Image src={profile.profileImageUrl} alt={`Foto pública de @${analysis.username}`} width={88} height={88} priority /> : <span className="analysis-avatar-fallback" aria-hidden="true">@</span>}</div>
      <div className="analysis-identity-copy">
        <div className="analysis-profile-badges"><span className="analysis-status-pill">{stateLabel}</span>{analysis.isCached && <span className="analysis-cache-pill">Análise recente reutilizada</span>}</div>
        <h1>{profile?.displayName || `@${analysis.username}`}{profile?.isVerified && <span className="analysis-verified" title="Conta verificada" aria-label="Conta verificada">✓</span>}</h1>
        <div className="analysis-profile-meta"><a href={analysis.profileUrl} target="_blank" rel="noreferrer">@{analysis.username} <span aria-hidden="true">↗</span></a>{profile?.category && <span>{profile.category}</span>}</div>
      </div>
    </div>
    <div className="analysis-header-side">
      <dl><div><dt>Analisado em</dt><dd>{formatDateTime(analysis.analyzedAt || analysis.requestedAt)}</dd></div><div><dt>Publicações</dt><dd>{analysis.posts.length} avaliadas</dd></div><div><dt>Fonte</dt><dd>Dados públicos {analysis.isCached ? "em cache" : "recentes"}</dd></div></dl>
      <details className="analysis-actions-menu"><summary aria-label="Mais ações"><span aria-hidden="true">•••</span></summary><div><a href={analysis.profileUrl} target="_blank" rel="noreferrer">Abrir no Instagram ↗</a><Link href="/#analisar">Analisar outro perfil</Link></div></details>
    </div>
  </header>;
}
