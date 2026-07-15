import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { decideFeatureAccess, type ProductFeatureRecord } from "./access";

const feature: ProductFeatureRecord = { key: "trending_reels", name: "Reels em alta", description: "", group: "trending", audience: "premium", status: "beta", visibility: "preview", enabled: true, requires_provider_call: true, provider: "scrapecreators", estimated_credit_cost: 1, dependencies: [], limits: {}, metadata: {} };

describe("decideFeatureAccess", () => {
  it("entrega preview, mas não o conteúdo, para visitante sem premium", () => {
    expect(decideFeatureAccess(feature)).toMatchObject({ visible: true, allowed: false, preview: true, reason: "premium_required" });
  });

  it("mantém recurso desabilitado invisível mesmo para premium", () => {
    expect(decideFeatureAccess({ ...feature, enabled: false }, { isPremium: true })).toMatchObject({ visible: false, allowed: false, reason: "disabled" });
  });

  it("só libera conteúdo completo para público elegível", () => {
    expect(decideFeatureAccess({ ...feature, visibility: "full" }, { isPremium: true })).toMatchObject({ visible: true, allowed: true, reason: "allowed" });
  });
});

describe("product feature migration", () => {
  const migration = readFileSync("supabase/migrations/202607150011_product_features_and_discovery.sql", "utf8");
  it("cria catálogo, interesse, categorias e snapshots com RLS", () => {
    for (const table of ["product_features", "content_categories", "feature_interest", "category_discovery_runs", "category_discovery_results", "trending_discovery_results"]) {
      expect(migration).toContain(`create table if not exists public.${table}`);
      expect(migration).toContain(`alter table public.${table} enable row level security`);
    }
  });

  it("não ativa recursos premium ou dependentes de busca externa", () => {
    for (const key of ["category_hashtag_discovery", "category_reels_discovery", "trending_reels", "reels_audio_discovery"]) {
      expect(migration).toMatch(new RegExp(`\\('${key}'[^\\n]+false,true`));
    }
  });
});
