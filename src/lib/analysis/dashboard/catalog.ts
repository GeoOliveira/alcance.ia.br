export const dashboardModuleKeys = [
  "profile_health_radar",
  "recent_posts_performance",
  "content_format_distribution",
  "top_reels_views",
  "top_hashtags",
  "format_comparison",
] as const;

export type DashboardModuleKey = (typeof dashboardModuleKeys)[number];
export type DashboardChartType = "radar" | "line" | "pie" | "bar" | "horizontal_bar" | "comparison";
export type DashboardAccessLevel = "public" | "free" | "premium" | "admin";
export type DashboardModuleStatus = "development" | "beta" | "active" | "disabled";

export type DashboardModuleDefinition = {
  key: DashboardModuleKey;
  title: string;
  description: string;
  icon: string;
  chartType: DashboardChartType;
  featureFlag: string;
  displayOrder: number;
  minimumData: number;
};

export const dashboardModuleCatalog: readonly DashboardModuleDefinition[] = [
  { key: "profile_health_radar", title: "Saúde do perfil", description: "Visão equilibrada dos principais fundamentos do perfil.", icon: "radar", chartType: "radar", featureFlag: "dashboard_radar", displayOrder: 10, minimumData: 3 },
  { key: "recent_posts_performance", title: "Desempenho das publicações recentes", description: "Evolução do engajamento estimado nas últimas publicações.", icon: "trend", chartType: "line", featureFlag: "dashboard_posts_chart", displayOrder: 20, minimumData: 2 },
  { key: "content_format_distribution", title: "Distribuição de formatos", description: "Participação de Reels, carrosséis e fotos no conteúdo analisado.", icon: "pie", chartType: "pie", featureFlag: "dashboard_formats_chart", displayOrder: 30, minimumData: 1 },
  { key: "top_reels_views", title: "Reels com mais visualizações", description: "Destaques por plays ou visualizações disponíveis.", icon: "play", chartType: "bar", featureFlag: "dashboard_top_reels_chart", displayOrder: 40, minimumData: 1 },
  { key: "top_hashtags", title: "Hashtags mais usadas", description: "Frequência das hashtags observadas nas publicações.", icon: "hashtag", chartType: "horizontal_bar", featureFlag: "dashboard_hashtags_chart", displayOrder: 50, minimumData: 1 },
  { key: "format_comparison", title: "Comparativo por formato", description: "Médias observadas de curtidas, comentários e visualizações.", icon: "compare", chartType: "comparison", featureFlag: "dashboard_comparison_chart", displayOrder: 60, minimumData: 1 },
] as const;

export const dashboardFeatureFlags = ["dashboard_enabled", ...dashboardModuleCatalog.map((item) => item.featureFlag), "dashboard_premium_preview"] as const;

