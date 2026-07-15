"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics/track";

export function AnalysisSectionTracker({ requestId, sectionId, actionPlan = false }: { requestId: string; sectionId: string; actionPlan?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => { const element = ref.current; if (!element || typeof IntersectionObserver === "undefined") return; const observer = new IntersectionObserver(([entry]) => { if (!entry?.isIntersecting) return; trackEvent(actionPlan ? "analysis_action_plan_viewed" : "analysis_section_viewed", { request_id: requestId, section_id: sectionId, page_path: window.location.pathname }, { dedupeKey: `${requestId}:${sectionId}`, dedupeWindowMs: 60_000 }); observer.disconnect(); }, { threshold: 0.35 }); observer.observe(element); return () => observer.disconnect(); }, [actionPlan, requestId, sectionId]);
  return <span aria-hidden="true" className="analysis-section-sentinel" ref={ref} />;
}
