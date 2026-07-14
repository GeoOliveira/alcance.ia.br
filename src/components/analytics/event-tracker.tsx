"use client";

import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics/track";
import type { AnalyticsEvent, AnalyticsEventProperties, TrackOptions } from "@/lib/analytics/types";

export function EventTracker<Name extends AnalyticsEvent>({
  name,
  properties,
  options,
}: {
  name: Name;
  properties?: AnalyticsEventProperties[Name];
  options?: TrackOptions;
}) {
  const initial = useRef({ properties, options });
  useEffect(() => {
    trackEvent(name, {
      page_path: window.location.pathname,
      ...initial.current.properties,
    } as AnalyticsEventProperties[Name], initial.current.options);
  }, [name]);
  return null;
}
