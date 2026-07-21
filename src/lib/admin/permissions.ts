import type { AdminPermission, AdminRole } from "@/types/admin";

const permissions: Record<AdminRole, readonly AdminPermission[]> = {
  super_admin: [
    "dashboard.view", "analysis.view", "analysis.manage", "analysis.export", "analysis.delete",
    "contacts.view", "contacts.manage", "contacts.export", "contacts.delete", "content.manage", "seo.manage", "seo.ai.generate", "faq.manage", "faq.delete",
    "settings.manage", "features.manage", "users.view", "users.manage", "audit.view",
    "provider_poc.view", "provider_poc.execute", "provider_poc.export", "provider_poc.delete",
    "ai_integration.view", "ai_integration.execute",
  ],
  admin: [
    "dashboard.view", "analysis.view", "analysis.manage", "analysis.export",
    "contacts.view", "contacts.manage", "contacts.export", "content.manage", "seo.manage", "seo.ai.generate", "faq.manage", "faq.delete", "settings.manage",
    "users.view", "audit.view",
    "provider_poc.view", "provider_poc.execute", "provider_poc.export",
    "ai_integration.view", "ai_integration.execute",
  ],
  editor: ["dashboard.view", "content.manage", "seo.manage", "seo.ai.generate", "faq.manage"],
  support: ["dashboard.view", "analysis.view", "analysis.manage", "contacts.view", "contacts.manage", "ai_integration.view"],
  analyst: ["dashboard.view", "analysis.export"],
};

export function hasPermission(role: AdminRole, permission: AdminPermission) {
  return permissions[role].includes(permission);
}

export function permissionsFor(role: AdminRole) {
  return permissions[role];
}

export function canAssignRole(actor: AdminRole, target: AdminRole) {
  if (actor !== "super_admin") return false;
  return target !== "super_admin";
}

export const roleLabels: Record<AdminRole, string> = {
  super_admin: "Superadministrador",
  admin: "Administrador",
  editor: "Editor",
  support: "Suporte",
  analyst: "Analista",
};
