import "server-only";
import { cache } from "react";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  getProductFeatureDefinition,
  productFeatureCatalog,
  type ProductFeatureAudience,
  type ProductFeatureKey,
  type ProductFeatureStatus,
  type ProductFeatureVisibility,
} from "./catalog";

export type ProductFeatureRecord = {
  key: ProductFeatureKey;
  name: string;
  description: string;
  group: "profile" | "category" | "trending" | "audio";
  audience: ProductFeatureAudience;
  status: ProductFeatureStatus;
  visibility: ProductFeatureVisibility;
  enabled: boolean;
  requires_provider_call: boolean;
  provider: "scrapecreators" | "internal";
  dependencies: ProductFeatureKey[];
  estimated_credit_cost: number;
  limits: Record<string, number>;
  metadata: Record<string, unknown>;
  updated_at?: string;
};

export type FeatureAccessContext = { isAuthenticated?: boolean; isPremium?: boolean; isAdmin?: boolean };
export type FeatureAccessDecision = {
  key: ProductFeatureKey;
  visible: boolean;
  allowed: boolean;
  preview: boolean;
  reason: "allowed" | "disabled" | "inactive" | "authentication_required" | "premium_required" | "admin_required";
  feature: ProductFeatureRecord;
};

function defaultRecord(key: ProductFeatureKey): ProductFeatureRecord {
  const definition = getProductFeatureDefinition(key);
  return {
    key,
    name: definition.name,
    description: definition.description,
    group: definition.group,
    audience: definition.defaultAudience,
    status: definition.defaultStatus,
    visibility: definition.defaultVisibility,
    enabled: definition.defaultEnabled,
    requires_provider_call: definition.requiresProviderCall,
    provider: definition.provider,
    dependencies: [...definition.dependencies],
    estimated_credit_cost: definition.estimatedCreditCost,
    limits: definition.defaultLimits,
    metadata: {},
  };
}

export const getProductFeatures = cache(async (): Promise<ProductFeatureRecord[]> => {
  const defaults = new Map(productFeatureCatalog.map((item) => [item.key, defaultRecord(item.key)]));
  try {
    const admin = createAdminClient();
    if (!admin) return [...defaults.values()];
    const { data, error } = await admin.from("product_features").select("key,name,description,feature_group,audience,status,visibility,enabled,requires_provider_call,provider,dependencies,estimated_credit_cost,limits,metadata,updated_at");
    if (error || !data) return [...defaults.values()];
    for (const row of data) {
      const current = defaults.get(row.key as ProductFeatureKey);
      if (!current) continue;
      defaults.set(current.key, {
        ...current,
        name: String(row.name || current.name),
        description: String(row.description || current.description),
        group: row.feature_group as ProductFeatureRecord["group"],
        audience: row.audience as ProductFeatureAudience,
        status: row.status as ProductFeatureStatus,
        visibility: row.visibility as ProductFeatureVisibility,
        enabled: row.enabled === true,
        requires_provider_call: row.requires_provider_call === true,
        provider: row.provider as ProductFeatureRecord["provider"],
        dependencies: Array.isArray(row.dependencies) ? row.dependencies.filter((value): value is ProductFeatureKey => typeof value === "string" && productFeatureCatalog.some((item) => item.key === value)) : current.dependencies,
        estimated_credit_cost: typeof row.estimated_credit_cost === "number" ? row.estimated_credit_cost : current.estimated_credit_cost,
        limits: row.limits && typeof row.limits === "object" ? row.limits as Record<string, number> : current.limits,
        metadata: row.metadata && typeof row.metadata === "object" ? row.metadata as Record<string, unknown> : current.metadata,
        updated_at: row.updated_at,
      });
    }
  } catch {
    // Defaults are deliberately conservative for every provider-backed feature.
  }
  return [...defaults.values()];
});

export function decideFeatureAccess(feature: ProductFeatureRecord, context: FeatureAccessContext = {}): FeatureAccessDecision {
  const preview = feature.visibility === "preview";
  if (!feature.enabled) return { key: feature.key, visible: false, allowed: false, preview, reason: "disabled", feature };
  if (feature.status === "disabled" || feature.status === "development") return { key: feature.key, visible: feature.visibility !== "hidden", allowed: false, preview, reason: "inactive", feature };
  if (feature.audience === "admin" && !context.isAdmin) return { key: feature.key, visible: preview, allowed: false, preview, reason: "admin_required", feature };
  if (feature.audience === "premium" && !context.isPremium && !context.isAdmin) return { key: feature.key, visible: preview, allowed: false, preview, reason: "premium_required", feature };
  if (feature.audience === "free" && !context.isAuthenticated && !context.isAdmin) return { key: feature.key, visible: preview, allowed: false, preview, reason: "authentication_required", feature };
  return { key: feature.key, visible: feature.visibility !== "hidden", allowed: feature.visibility === "full", preview, reason: "allowed", feature };
}

export async function getFeatureAccessMap(context: FeatureAccessContext = {}) {
  const features = await getProductFeatures();
  return Object.fromEntries(features.map((feature) => [feature.key, decideFeatureAccess(feature, context)])) as Record<ProductFeatureKey, FeatureAccessDecision>;
}
