"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/analytics/track";
import type { ProductFeatureKey } from "@/lib/product-features/catalog";

export function FeatureInterestButton({ featureKey, source = "resources_page" }: { featureKey: ProductFeatureKey; source?: "resources_page" | "analysis_result" | "discovery_page" | "branded_content_page" }) {
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  async function submit() {
    if (state === "sending" || state === "done") return;
    setState("sending");
    try {
      const response = await fetch("/api/feature-interest", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ featureKey, source }) });
      if (!response.ok) throw new Error("interest_failed");
      setState("done");
      trackEvent("feature_interest_submitted", { section_id: featureKey, cta_location: source });
      trackEvent("feature_interest_registered", { section_id: featureKey, cta_location: source });
    } catch { setState("error"); }
  }
  return <div className="feature-interest-control"><button type="button" className="button button-secondary" onClick={submit} disabled={state === "sending" || state === "done"}>{state === "sending" ? "Registrando…" : state === "done" ? "Interesse registrado" : "Quero ser avisado"}</button>{state === "error" && <small role="status">Não foi possível registrar agora. Tente novamente.</small>}</div>;
}
