import "server-only";
import { cache } from "react";
import { getProductFeatures, decideFeatureAccess } from "@/lib/product-features/access";
import { getHomeContent, getPublicFlags } from "@/lib/settings/public-content";
import type { WhatsAppGeneratorFlags } from "./types";
import { getEncurtaConfig } from "@/lib/integrations/encurta/config";
import type { EncurtaAccessLevel } from "@/lib/integrations/encurta/types";

export const whatsappContentDefaults = {
  hero_title: "Crie seu link do WhatsApp em poucos segundos",
  hero_description: "Informe seu número, adicione uma mensagem personalizada e gere um link direto para iniciar conversas no WhatsApp.",
  hero_notice: "Seu número é utilizado somente para montar o link e não precisa ser armazenado.",
  how_it_works_title: "Como criar seu link direto",
  benefits_title: "Um caminho mais simples para iniciar conversas",
  use_cases_title: "Use seu link onde seus clientes já estão",
  privacy_title: "Seu número permanece sob seu controle",
  privacy_description: "A ferramenta apenas monta o endereço oficial que abre uma conversa. Ela não solicita senha, acessa mensagens ou envia conteúdo automaticamente.",
  final_cta_title: "Crie agora seu link do WhatsApp",
  final_cta_description: "Facilite o contato com seus clientes usando um link direto e uma mensagem personalizada.",
  final_cta_button: "Gerar meu link",
} as const;

const flagDefaults = {
  resource_whatsapp_link_generator: true,
  whatsapp_link_custom_message: true,
  whatsapp_link_copy: true,
  whatsapp_link_open: true,
  whatsapp_link_share: true,
  whatsapp_link_shortener: false,
  encurta_integration: false,
  whatsapp_link_shortener_share: false,
  whatsapp_link_shortener_anonymous: false,
  whatsapp_link_shortener_free: false,
  whatsapp_link_shortener_premium: false,
} as const;

export function shortenerTierAllowed(accessLevel: EncurtaAccessLevel, flags: Pick<Record<keyof typeof flagDefaults, boolean>, "whatsapp_link_shortener_anonymous" | "whatsapp_link_shortener_free" | "whatsapp_link_shortener_premium">) {
  return accessLevel === "admin"
    || (accessLevel === "premium" && flags.whatsapp_link_shortener_premium)
    || (accessLevel === "free" && flags.whatsapp_link_shortener_free)
    || (["anonymous", "public"].includes(accessLevel) && flags.whatsapp_link_shortener_anonymous);
}

export const getWhatsAppGeneratorConfig = cache(async (shortenerAccessLevel: EncurtaAccessLevel = "anonymous") => {
  const [features, persistedFlags, persistedContent] = await Promise.all([
    getProductFeatures(),
    getPublicFlags(),
    getHomeContent(),
  ]);
  const feature = features.find((item) => item.key === "whatsapp_link_generator")!;
  const access = decideFeatureAccess(feature, {
    isAuthenticated: !["anonymous", "public"].includes(shortenerAccessLevel),
    isPremium: ["premium", "admin"].includes(shortenerAccessLevel),
    isAdmin: shortenerAccessLevel === "admin",
  });
  const flag = (key: keyof typeof flagDefaults) => persistedFlags[key] ?? flagDefaults[key];
  const metadata = feature.metadata;
  const content = Object.fromEntries(Object.entries(whatsappContentDefaults).map(([key, fallback]) => [
    key,
    persistedContent[`whatsapp_generator.${key}`] || fallback,
  ])) as Record<keyof typeof whatsappContentDefaults, string>;
  const encurta = getEncurtaConfig();
  const tierAllowed = shortenerTierAllowed(shortenerAccessLevel, {
    whatsapp_link_shortener_anonymous: flag("whatsapp_link_shortener_anonymous"),
    whatsapp_link_shortener_free: flag("whatsapp_link_shortener_free"),
    whatsapp_link_shortener_premium: flag("whatsapp_link_shortener_premium"),
  });
  const shortenerAvailable = tierAllowed && flag("whatsapp_link_shortener") && flag("encurta_integration") && encurta.enabled && encurta.configured && metadata.shortenerEnabled === true;
  const flags: WhatsAppGeneratorFlags = {
    customMessage: flag("whatsapp_link_custom_message") && metadata.messageEnabled !== false,
    copy: flag("whatsapp_link_copy") && metadata.copyEnabled !== false,
    open: flag("whatsapp_link_open") && metadata.openLinkEnabled !== false,
    share: flag("whatsapp_link_share") && metadata.shareEnabled !== false,
    shortener: shortenerAvailable,
    shortenerShare: shortenerAvailable && flag("whatsapp_link_shortener_share"),
  };
  return {
    feature,
    access: { ...access, allowed: access.allowed && flag("resource_whatsapp_link_generator") },
    flags,
    content,
    messageMaxCharacters: Math.min(2000, Math.max(1, Number(metadata.messageMaxCharacters) || 500)),
    unavailableMessage: typeof metadata.unavailableMessage === "string" && metadata.unavailableMessage
      ? metadata.unavailableMessage
      : "Esta ferramenta está temporariamente indisponível.",
    indexable: metadata.indexable !== false,
    shortenerConfigured: encurta.configured,
  };
});
