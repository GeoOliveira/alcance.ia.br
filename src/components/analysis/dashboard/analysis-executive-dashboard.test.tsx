import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { AnalysisExecutiveDashboard } from "./analysis-executive-dashboard";
import type { DashboardModuleRecord } from "@/lib/analysis/dashboard/access";
import type { DashboardData } from "@/lib/analysis/dashboard/data";

const emptyData: DashboardData = { profileHealth: [], recentPosts: [], formatDistribution: [], topReels: [], topHashtags: [], formatComparison: [] };
const dashboardModule: DashboardModuleRecord = { key: "profile_health_radar", title: "Saúde do perfil", description: "Fundamentos", icon: "radar", chartType: "radar", enabled: true, visible: true, accessLevel: "public", status: "active", displayOrder: 10, requiresAI: false, requiresAuthentication: false, requiresPremium: false, minimumData: 3, dependencies: [], preview: false, allowed: true };

describe("AnalysisExecutiveDashboard", () => {
  it("renders the dashboard and a useful insufficient-data state", () => { const html = renderToStaticMarkup(<AnalysisExecutiveDashboard modules={[dashboardModule]} data={emptyData} requestId="request" />); expect(html).toContain('id="dashboard-executivo"'); expect(html).toContain("Dados insuficientes"); expect(html).toContain("Saúde do perfil"); });
  it("renders premium modules as visible previews", () => { const html = renderToStaticMarkup(<AnalysisExecutiveDashboard modules={[{ ...dashboardModule, preview: true, allowed: false }]} data={emptyData} requestId="request" />); expect(html).toContain("Disponível no Plano Premium"); expect(html).toContain("Conhecer recurso"); });
  it("keeps the report available when chart rendering fails", () => { const html = renderToStaticMarkup(<AnalysisExecutiveDashboard modules={[dashboardModule]} data={emptyData} requestId="request" state="error" />); expect(html).toContain("restante do relatório continuam disponíveis"); });
});
