import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AnalysisExecutiveDashboard } from "./analysis-executive-dashboard";
import type { DashboardModuleRecord } from "@/lib/analysis/dashboard/access";
import type { DashboardData } from "@/lib/analysis/dashboard/data";

const emptyData: DashboardData = { profileHealth: [], recentPosts: [], formatDistribution: [], topReels: [], topHashtags: [], formatComparison: [] };
const dashboardModule: DashboardModuleRecord = { key: "profile_health_radar", title: "Saúde do perfil", description: "Fundamentos", icon: "radar", chartType: "radar", enabled: true, visible: true, accessLevel: "public", status: "active", displayOrder: 10, requiresAI: false, requiresAuthentication: false, requiresPremium: false, minimumData: 3, dependencies: [], preview: false, allowed: true };

describe("AnalysisExecutiveDashboard", () => {
  it("renders the dashboard and a useful insufficient-data state", () => { const html = renderToStaticMarkup(<AnalysisExecutiveDashboard modules={[dashboardModule]} data={emptyData} requestId="request" />); expect(html).toContain('id="dashboard-executivo"'); expect(html).toContain("Dados insuficientes"); expect(html).toContain("Saúde do perfil"); });
  it("renders premium modules in place with blurred content and a Premium button", () => { const html = renderToStaticMarkup(<AnalysisExecutiveDashboard modules={[{ ...dashboardModule, preview: true, allowed: false }]} data={emptyData} requestId="request" />); expect(html).toContain("analysis-dashboard-premium-content"); expect(html).toContain(">Premium</button>"); });
  it("renders each Reel link below its chart column", () => { const data = { ...emptyData, topReels: [{ name: "#reel1", views: 1200, url: "https://www.instagram.com/reel/reel1/" }] }; const reelModule = { ...dashboardModule, key: "top_reels_views" as const, chartType: "bar" as const, minimumData: 1 }; const html = renderToStaticMarkup(<AnalysisExecutiveDashboard modules={[reelModule]} data={data} requestId="request" />); expect(html).toContain('class="analysis-dashboard-reel-links"'); expect(html).toContain('href="https://www.instagram.com/reel/reel1/"'); expect(html).toContain("Abrir #reel1 no Instagram"); });
  it("keeps graph titles white on a contrasting header", () => { const css = readFileSync(new URL("../../../app/analisar/analysis.css", import.meta.url), "utf8"); expect(css).toContain(".analysis-dashboard-card h3 { margin: 0; color: #fff;"); expect(css).toContain("background: linear-gradient(115deg, #244f3d, #356b53)"); });
  it("keeps the report available when chart rendering fails", () => { const html = renderToStaticMarkup(<AnalysisExecutiveDashboard modules={[dashboardModule]} data={emptyData} requestId="request" state="error" />); expect(html).toContain("restante do relatório continuam disponíveis"); });
});
