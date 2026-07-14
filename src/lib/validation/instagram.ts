import { z } from "zod";

const RESERVED_PATHS = new Set(["accounts", "about", "developer", "explore", "legal", "privacy", "reels"]);
const USERNAME_PATTERN = /^[a-zA-Z0-9._]{1,30}$/;

export function normalizeInstagramUsername(raw: string): string {
  let value = raw.trim();
  if (!value) throw new Error("Informe um nome de usuário ou URL do Instagram.");
  if (value.length > 300) throw new Error("O valor informado é muito longo.");

  value = value.replace(/^@+/, "");
  if (/^(?:https?:\/\/)?(?:www\.)?instagram\.com\//i.test(value)) {
    const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
    let url: URL;
    try {
      url = new URL(withProtocol);
    } catch {
      throw new Error("A URL do Instagram não é válida.");
    }
    const host = url.hostname.toLowerCase();
    if (host !== "instagram.com" && host !== "www.instagram.com") {
      throw new Error("Use apenas uma URL pública do Instagram.");
    }
    value = url.pathname.split("/").filter(Boolean)[0] || "";
  } else if (/^https?:\/\//i.test(value) || value.includes("/")) {
    throw new Error("Use um nome de usuário ou uma URL pública do Instagram.");
  }

  value = value.replace(/^@+|\/+$/g, "").toLowerCase();
  if (!USERNAME_PATTERN.test(value) || value.startsWith(".") || value.endsWith(".") || value.includes("..")) {
    throw new Error("Use até 30 letras, números, pontos ou sublinhados.");
  }
  if (RESERVED_PATHS.has(value)) throw new Error("Informe o nome de um perfil do Instagram.");
  return value;
}

export const instagramInputSchema = z
  .string()
  .min(1)
  .max(300)
  .transform((value, ctx) => {
    try {
      return normalizeInstagramUsername(value);
    } catch (error) {
      ctx.addIssue({ code: "custom", message: error instanceof Error ? error.message : "Valor inválido." });
      return z.NEVER;
    }
  });
