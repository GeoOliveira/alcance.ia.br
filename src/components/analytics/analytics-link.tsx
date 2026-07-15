"use client";

import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { trackEvent } from "@/lib/analytics/track";
import type { AnalyticsEvent, AnalyticsEventProperties } from "@/lib/analytics/types";

export function AnalyticsLink<Name extends AnalyticsEvent>({
  href,
  children,
  className,
  style,
  eventName,
  properties,
  onClick,
  rel,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  eventName: Name;
  properties?: AnalyticsEventProperties[Name];
  onClick?: () => void;
  rel?: string;
}) {
  return (
    <Link
      href={href}
      className={className}
      style={style}
      rel={rel}
      onClick={() => {
        trackEvent(eventName, properties);
        onClick?.();
      }}
    >
      {children}
    </Link>
  );
}
