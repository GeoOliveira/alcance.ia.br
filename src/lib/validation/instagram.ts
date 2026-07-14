import { z } from "zod";

const RESERVED_PATHS = new Set([
  "about",
  "accounts",
  "api",
  "challenge",
  "developer",
  "developers",
  "direct",
  "directory",
  "emails",
  "explore",
  "legal",
  "oauth",
  "p",
  "privacy",
  "reel",
  "reels",
  "static",
  "stories",
  "tv",
  "web",
]);
const USERNAME_PATTERN = /^[a-zA-Z0-9._]{1,30}$/;

export function isValidInstagramUsername(value: string): boolean {
  return (
    USERNAME_PATTERN.test(value) &&
    !value.startsWith(".") &&
    !value.endsWith(".") &&
    !value.includes("..") &&
    !RESERVED_PATHS.has(value.toLowerCase())
  );
}

export function isInstagramProfileUrl(raw: string): boolean {
  if (!/^(?:https?:\/\/)?(?:www\.)?instagram\.com\//i.test(raw.trim())) return false;

  try {
    const value = raw.trim();
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    const host = url.hostname.toLowerCase();
    const segments = url.pathname.split("/").filter(Boolean);
    return (
      (host === "instagram.com" || host === "www.instagram.com") &&
      segments.length === 1 &&
      isValidInstagramUsername(segments[0])
    );
  } catch {
    return false;
  }
}

export function normalizeInstagramUsername(raw: string): string {
  let value = raw.trim();
  if (!value) throw new Error("Informe um nome de usuário ou URL do Instagram.");
  if (value.length > 300) throw new Error("O valor informado é muito longo.");

  value = value.replace(/^@+/, "");
  if (/^(?:https?:\/\/)?(?:www\.)?instagram\.com\//i.test(value)) {
    if (!isInstagramProfileUrl(value)) {
      throw new Error("Use a URL de um perfil, não de publicações ou áreas internas do Instagram.");
    }
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    const url = new URL(withProtocol);
    value = url.pathname.split("/").filter(Boolean)[0];
  } else if (/^https?:\/\//i.test(value) || value.includes("/")) {
    throw new Error("Use um nome de usuário ou uma URL pública do Instagram.");
  }

  value = value.replace(/^@+|\/+$/g, "").toLowerCase();
  if (!isValidInstagramUsername(value)) {
    if (RESERVED_PATHS.has(value)) throw new Error("Informe o nome de um perfil do Instagram.");
    throw new Error("Use até 30 letras, números, pontos ou sublinhados.");
  }
  return value;
}

export const instagramInputSchema = z
  .string()
  .min(1, "Informe um nome de usuário ou URL do Instagram.")
  .max(300, "O valor informado é muito longo.")
  .transform((value, ctx) => {
    try {
      return normalizeInstagramUsername(value);
    } catch (error) {
      ctx.addIssue({ code: "custom", message: error instanceof Error ? error.message : "Valor inválido." });
      return z.NEVER;
    }
  });
