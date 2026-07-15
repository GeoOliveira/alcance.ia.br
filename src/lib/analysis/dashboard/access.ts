import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import { dashboardModuleCatalog, type DashboardAccessLevel, type DashboardChartType, type DashboardModuleKey, type DashboardModuleStatus } from "./catalog";

export type DashboardModuleRecord = {
  key: DashboardModuleKey; title: string; description: string; icon: string; chartType: DashboardChartType;
  enabled: boolean; visible: boolean; accessLevel: DashboardAccessLevel; status: DashboardModuleStatus; displayOrder: number;
  requiresAI: boolean; requiresAuthentication: boolean; requiresPremium: boolean; minimumData: number;
  dependencies: string[]; preview: boolean; allowed: boolean;
};

export type DashboardAccessContext = { isAuthenticated?: boolean; isPremium?: boolean; isAdmin?: boolean; hasAI?: boolean };

const defaults = () => dashboardModuleCatalog.map((item): DashboardModuleRecord => ({ key: item.key, title: item.title, description: item.description, icon: item.icon, chartType: item.chartType, enabled: true, visible: true, accessLevel: "public", status: "active", displayOrder: item.displayOrder, requiresAI: false, requiresAuthentication: false, requiresPremium: false, minimumData: item.minimumData, dependencies: [], preview: false, allowed: true }));

export function decideDashboardModuleAccess(item: Omit<DashboardModuleRecord, "preview" | "allowed">, context: DashboardAccessContext, premiumPreview: boolean): DashboardModuleRecord {
  const requiresAuth = item.requiresAuthentication || item.accessLevel === "free";
  const requiresPremium = item.requiresPremium || item.accessLevel === "premium";
  const denied = !item.enabled || !item.visible || item.status === "disabled" || item.status === "development" || (item.requiresAI && !context.hasAI) || (item.accessLevel === "admin" && !context.isAdmin) || (requiresAuth && !context.isAuthenticated && !context.isAdmin) || (requiresPremium && !context.isPremium && !context.isAdmin);
  const preview = denied && premiumPreview && requiresPremium && item.enabled && item.visible && item.status !== "disabled";
  return { ...item, preview, allowed: !denied };
}

export const getDashboardModules = cache(async (context: DashboardAccessContext = {}): Promise<DashboardModuleRecord[]> => {
  const fallback = defaults();
  try {
    const admin = createAdminClient();
    if (!admin) return fallback;
    const [{ data: rows, error }, { data: flags }] = await Promise.all([
      admin.from("dashboard_modules").select("key,title,description,icon,chart_type,enabled,visible,access_level,status,display_order,requires_ai,requires_authentication,requires_premium,configuration"),
      admin.from("feature_flags").select("key,enabled").in("key", ["dashboard_enabled", "dashboard_radar", "dashboard_posts_chart", "dashboard_formats_chart", "dashboard_top_reels_chart", "dashboard_hashtags_chart", "dashboard_comparison_chart", "dashboard_premium_preview"]),
    ]);
    const flagMap = new Map((flags ?? []).map((flag) => [flag.key, flag.enabled === true]));
    if (flagMap.get("dashboard_enabled") === false) return [];
    if (error || !rows) return fallback.filter((item) => {
      const definition = dashboardModuleCatalog.find((definitionItem) => definitionItem.key === item.key);
      return !definition || flagMap.get(definition.featureFlag) !== false;
    });
    const premiumPreview = flagMap.get("dashboard_premium_preview") !== false;
    const decisions = rows.flatMap((row) => {
      const definition = dashboardModuleCatalog.find((item) => item.key === row.key);
      if (!definition || flagMap.get(definition.featureFlag) === false) return [];
      const configuration = row.configuration && typeof row.configuration === "object" ? row.configuration as { minimumData?: number; dependencies?: string[] } : {};
      const record = { key: definition.key, title: String(row.title || definition.title), description: String(row.description || definition.description), icon: String(row.icon || definition.icon), chartType: row.chart_type as DashboardChartType, enabled: row.enabled === true, visible: row.visible === true, accessLevel: row.access_level as DashboardAccessLevel, status: row.status as DashboardModuleStatus, displayOrder: Number(row.display_order), requiresAI: row.requires_ai === true, requiresAuthentication: row.requires_authentication === true, requiresPremium: row.requires_premium === true, minimumData: Math.max(1, Number(configuration.minimumData ?? definition.minimumData)), dependencies: Array.isArray(configuration.dependencies) ? configuration.dependencies.filter((value): value is string => typeof value === "string") : [] };
      const decision = decideDashboardModuleAccess(record, context, premiumPreview);
      return decision.allowed || decision.preview ? [decision] : [];
    });
    const availableKeys = new Set(decisions.filter((item) => item.allowed).map((item) => item.key));
    return decisions.filter((item) => item.dependencies.every((dependency) => !dashboardModuleCatalog.some((definition) => definition.key === dependency) || availableKeys.has(dependency as DashboardModuleKey))).sort((a, b) => a.displayOrder - b.displayOrder);
  } catch { return fallback; }
});
