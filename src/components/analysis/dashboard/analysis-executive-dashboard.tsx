"use client";

import { useEffect, useRef } from "react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart,
  PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { trackEvent } from "@/lib/analytics/track";
import type { DashboardData } from "@/lib/analysis/dashboard/data";
import type { DashboardModuleKey } from "@/lib/analysis/dashboard/catalog";
import type { DashboardModuleRecord } from "@/lib/analysis/dashboard/access";

const colors = ["#4f7f69", "#d19a57", "#7895c5", "#b97777"];
const compactNumber = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });

function ModuleTracker({ requestId, moduleKey, preview }: { requestId: string; moduleKey: DashboardModuleKey; preview: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry?.isIntersecting) return;
      trackEvent(preview ? "analysis_dashboard_premium_preview_viewed" : "analysis_dashboard_chart_viewed", { request_id: requestId, section_id: moduleKey, page_path: window.location.pathname }, { dedupeKey: `${requestId}:dashboard:${moduleKey}`, dedupeWindowMs: 60_000 });
      observer.disconnect();
    }, { threshold: 0.35 });
    observer.observe(element);
    return () => observer.disconnect();
  }, [moduleKey, preview, requestId]);
  return <div className="analysis-dashboard-tracker" ref={ref} aria-hidden="true" />;
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name?: string; value?: number; color?: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return <div className="analysis-chart-tooltip"><strong>{label}</strong>{payload.map((item) => <span key={`${item.name}-${item.value}`}><i style={{ background: item.color }} />{item.name}: {compactNumber.format(item.value ?? 0)}</span>)}</div>;
}

function ChartForModule({ moduleKey, data, requestId, locked = false }: { moduleKey: DashboardModuleKey; data: DashboardData; requestId: string; locked?: boolean }) {
  if (moduleKey === "profile_health_radar") return <ResponsiveContainer width="100%" height="100%"><RadarChart data={data.profileHealth} accessibilityLayer><PolarGrid stroke="var(--dashboard-grid)" /><PolarAngleAxis dataKey="subject" tick={{ fill: "var(--dashboard-muted)", fontSize: 12 }} /><Radar name="Pontuação" dataKey="value" stroke="#4f7f69" fill="#4f7f69" fillOpacity={0.28} animationDuration={500} /><Tooltip content={<ChartTooltip />} /></RadarChart></ResponsiveContainer>;
  if (moduleKey === "recent_posts_performance") return <ResponsiveContainer width="100%" height="100%"><LineChart data={data.recentPosts} accessibilityLayer margin={{ top: 10, right: 12, left: -18, bottom: 0 }}><CartesianGrid stroke="var(--dashboard-grid)" strokeDasharray="4 4" /><XAxis dataKey="label" tick={{ fill: "var(--dashboard-muted)", fontSize: 12 }} /><YAxis tick={{ fill: "var(--dashboard-muted)", fontSize: 12 }} unit="%" /><Tooltip content={<ChartTooltip />} /><Line name="Engajamento (%)" type="monotone" dataKey="engagement" stroke="#4f7f69" strokeWidth={3} dot={{ r: 3 }} animationDuration={500} /></LineChart></ResponsiveContainer>;
  if (moduleKey === "content_format_distribution") return <ResponsiveContainer width="100%" height="100%"><PieChart accessibilityLayer><Pie data={data.formatDistribution} dataKey="value" nameKey="name" innerRadius={54} outerRadius={88} paddingAngle={3} animationDuration={500}>{data.formatDistribution.map((item, index) => <Cell key={item.name} fill={colors[index % colors.length]} />)}</Pie><Tooltip content={<ChartTooltip />} /><Legend iconType="circle" /></PieChart></ResponsiveContainer>;
  if (moduleKey === "top_reels_views") return <div className="analysis-dashboard-reels-chart"><div><ResponsiveContainer width="100%" height="100%"><BarChart data={data.topReels} accessibilityLayer margin={{ top: 10, right: 12, left: -8, bottom: 0 }}><CartesianGrid stroke="var(--dashboard-grid)" strokeDasharray="4 4" vertical={false} /><XAxis dataKey="name" tick={{ fill: "var(--dashboard-muted)", fontSize: 12 }} /><YAxis tickFormatter={(value) => compactNumber.format(value)} tick={{ fill: "var(--dashboard-muted)", fontSize: 12 }} /><Tooltip content={<ChartTooltip />} /><Bar name="Visualizações" dataKey="views" fill="#2563eb" radius={[8, 8, 2, 2]} animationDuration={500} /></BarChart></ResponsiveContainer></div><div className="analysis-dashboard-reel-links" style={{ gridTemplateColumns: `repeat(${data.topReels.length}, minmax(0, 1fr))` }}>{data.topReels.map((reel, index) => reel.url ? locked ? <span key={`${reel.name}-${index}`} aria-hidden="true">↗</span> : <a key={`${reel.name}-${index}`} href={reel.url} target="_blank" rel="noreferrer" aria-label={`Abrir ${reel.name} no Instagram`} onClick={() => trackEvent("analysis_top_post_clicked", { request_id: requestId, cta_location: "dashboard_top_reels" })}>↗</a> : <span key={`${reel.name}-${index}`} aria-label={`Link indisponível para ${reel.name}`}>—</span>)}</div></div>;
  if (moduleKey === "top_hashtags") return <ResponsiveContainer width="100%" height="100%"><BarChart data={data.topHashtags} layout="vertical" accessibilityLayer margin={{ top: 5, right: 12, left: 12, bottom: 0 }}><CartesianGrid stroke="var(--dashboard-grid)" strokeDasharray="4 4" horizontal={false} /><XAxis type="number" allowDecimals={false} tick={{ fill: "var(--dashboard-muted)", fontSize: 12 }} /><YAxis type="category" dataKey="name" width={90} tick={{ fill: "var(--dashboard-muted)", fontSize: 12 }} /><Tooltip content={<ChartTooltip />} /><Bar name="Publicações" dataKey="count" fill="#2563eb" radius={[2, 8, 8, 2]} animationDuration={500} /></BarChart></ResponsiveContainer>;
  return <ResponsiveContainer width="100%" height="100%"><BarChart data={data.formatComparison} accessibilityLayer margin={{ top: 10, right: 12, left: -8, bottom: 0 }}><CartesianGrid stroke="var(--dashboard-grid)" strokeDasharray="4 4" vertical={false} /><XAxis dataKey="format" tick={{ fill: "var(--dashboard-muted)", fontSize: 12 }} /><YAxis tickFormatter={(value) => compactNumber.format(value)} tick={{ fill: "var(--dashboard-muted)", fontSize: 12 }} /><Tooltip content={<ChartTooltip />} /><Legend iconType="circle" /><Bar name="Curtidas" dataKey="likes" fill="#1d4ed8" radius={[5, 5, 0, 0]} /><Bar name="Comentários" dataKey="comments" fill="#3b82f6" radius={[5, 5, 0, 0]} /><Bar name="Visualizações" dataKey="views" fill="#93c5fd" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer>;
}

function moduleDataLength(key: DashboardModuleKey, data: DashboardData) {
  return ({ profile_health_radar: data.profileHealth.length, recent_posts_performance: data.recentPosts.length, content_format_distribution: data.formatDistribution.length, top_reels_views: data.topReels.length, top_hashtags: data.topHashtags.length, format_comparison: data.formatComparison.length })[key];
}

function DashboardCard({ module, data, requestId }: { module: DashboardModuleRecord; data: DashboardData; requestId: string }) {
  const insufficient = moduleDataLength(module.key, data) < module.minimumData;
  return <article className={`analysis-dashboard-card${module.preview ? " is-premium" : ""}`} data-module={module.key}>
    <ModuleTracker requestId={requestId} moduleKey={module.key} preview={module.preview} />
    <header><div><span className="analysis-dashboard-icon" aria-hidden="true">{module.icon === "hashtag" ? "#" : module.icon === "play" ? "▶" : "↗"}</span><h3>{module.title}</h3></div><div>{module.status === "beta" && <span className="analysis-dashboard-badge">Beta</span>}{module.preview && <span className="analysis-dashboard-badge is-premium">Premium</span>}</div></header>
    <p>{module.description}</p>
    {module.preview ? <div className="analysis-dashboard-premium-preview"><div className="analysis-dashboard-premium-content" aria-hidden="true">{insufficient ? <div className="analysis-dashboard-empty"><strong>Dados insuficientes</strong><span>Este gráfico precisa de mais dados válidos.</span></div> : <div className="analysis-dashboard-chart"><ChartForModule moduleKey={module.key} data={data} requestId={requestId} locked /></div>}</div><div className="analysis-dashboard-premium-lock"><button type="button" onClick={() => trackEvent("analysis_dashboard_premium_clicked", { request_id: requestId, section_id: module.key, cta_location: "executive_dashboard" })}><span aria-hidden="true">✦</span>Premium</button></div></div> : insufficient ? <div className="analysis-dashboard-empty" role="status"><strong>Dados insuficientes</strong><span>Este gráfico será exibido quando houver pelo menos {module.minimumData} {module.minimumData === 1 ? "item válido" : "itens válidos"} na análise.</span></div> : <div className="analysis-dashboard-chart"><ChartForModule moduleKey={module.key} data={data} requestId={requestId} /></div>}
  </article>;
}

export function AnalysisExecutiveDashboard({ modules, data, requestId, state = "ready" }: { modules: DashboardModuleRecord[]; data: DashboardData; requestId: string; state?: "loading" | "ready" | "error" }) {
  useEffect(() => { if (state === "ready" && modules.length) trackEvent("analysis_dashboard_opened", { request_id: requestId, section_id: "dashboard-executivo", page_path: window.location.pathname }, { dedupeKey: `${requestId}:dashboard:opened`, dedupeWindowMs: 60_000 }); }, [modules.length, requestId, state]);
  if (!modules.length) return null;
  return <section className="analysis-dashboard" id="dashboard-executivo" aria-labelledby="dashboard-executivo-title">
    <div className="analysis-dashboard-heading"><span>VISÃO EXECUTIVA</span><h2 id="dashboard-executivo-title">Dashboard do perfil</h2><p>Os principais sinais desta análise reunidos em visualizações rápidas.</p></div>
    {state === "loading" ? <div className="analysis-dashboard-grid" aria-busy="true">{modules.map((module) => <div className="analysis-dashboard-card is-loading" key={module.key}><i /><i /><i /></div>)}</div> : state === "error" ? <div className="analysis-dashboard-error" role="alert"><strong>Não foi possível preparar os gráficos</strong><span>As métricas e o restante do relatório continuam disponíveis abaixo.</span></div> : <div className="analysis-dashboard-grid">{modules.map((module) => <DashboardCard key={module.key} module={module} data={data} requestId={requestId} />)}</div>}
  </section>;
}
