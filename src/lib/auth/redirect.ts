export function safeUserRedirect(value: string | null | undefined, fallback = "/painel") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  try {
    const url = new URL(value, "https://alcance.ia.br");
    if (url.origin !== "https://alcance.ia.br") return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
