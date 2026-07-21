export function resolveAuthOrigin(requestOrigin: string | null, fallback: string) {
  for (const candidate of [requestOrigin, fallback]) {
    if (!candidate) continue;
    try {
      const url = new URL(candidate);
      const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
      if (url.protocol !== "https:" && !(local && url.protocol === "http:")) continue;
      if (url.username || url.password) continue;
      return url.origin;
    } catch { /* tenta o fallback */ }
  }
  return "http://localhost:3000";
}
