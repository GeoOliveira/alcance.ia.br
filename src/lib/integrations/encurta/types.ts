export type EncurtaAccessLevel = "anonymous" | "public" | "free" | "premium" | "admin";

export type ShortenedWhatsAppLinkResult = {
  id: string;
  slug: string;
  shortUrl: string;
  officialUrl: string;
  status: "active";
  expiresAt: string | null;
  createdAt: string;
  idempotentReplay: boolean;
};

export type EncurtaClientResult = ShortenedWhatsAppLinkResult & { retryCount: number };

export type EncurtaLinkSnapshot = {
  id: string;
  status: "active" | "disabled" | "blocked" | "expired";
  clickCount: number;
  lastAccessedAt: string | null;
};

export type EncurtaErrorCode = "integration_disabled" | "not_configured" | "rate_limited" | "timeout" | "service_unavailable" | "invalid_response" | "idempotency_conflict" | "request_failed";
