import type { NextConfig } from "next";

function supabaseConnections() {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "");
    const websocket = `${url.protocol === "https:" ? "wss:" : "ws:"}//${url.host}`;
    return `${url.origin} ${websocket}`;
  } catch {
    return "";
  }
}

function supabaseOrigin() {
  try { return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "").origin; }
  catch { return ""; }
}

const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""} https://accounts.google.com/gsi/client https://va.vercel-scripts.com https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://connect.facebook.net https://s.pinimg.com https://www.redditstatic.com https://challenges.cloudflare.com`,
  "script-src-attr 'none'",
  "style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style",
  `img-src 'self' data: blob: ${supabaseOrigin()} https://*.cdninstagram.com https://*.fbcdn.net https://www.google-analytics.com https://www.googletagmanager.com https://www.facebook.com https://ct.pinterest.com https://alb.reddit.com https://www.clarity.ms`.replace(/\s+/g, " "),
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseConnections()} https://accounts.google.com/gsi/ https://vitals.vercel-insights.com https://va.vercel-scripts.com https://www.google-analytics.com https://region1.google-analytics.com https://www.googletagmanager.com https://www.clarity.ms https://*.clarity.ms https://www.facebook.com https://connect.facebook.net https://ct.pinterest.com https://alb.reddit.com https://challenges.cloudflare.com`.replace(/\s+/g, " "),
  "frame-src https://accounts.google.com/gsi/ https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "manifest-src 'self'",
  ...(process.env.NODE_ENV === "production" ? ["upgrade-insecure-requests"] : []),
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: { serverActions: { bodySizeLimit: "3mb" } },
  images: { remotePatterns: [
    { protocol: "https", hostname: "**.cdninstagram.com" },
    { protocol: "https", hostname: "**.fbcdn.net" },
  ] },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          ...(process.env.NODE_ENV === "production"
            ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
            : []),
        ],
      },
    ];
  },
};

export default nextConfig;
