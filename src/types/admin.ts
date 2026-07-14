export const adminRoles = ["super_admin", "admin", "editor", "support", "analyst"] as const;
export type AdminRole = (typeof adminRoles)[number];

export const adminPermissions = [
  "dashboard.view",
  "analysis.view",
  "analysis.manage",
  "analysis.export",
  "analysis.delete",
  "contacts.view",
  "contacts.manage",
  "contacts.export",
  "contacts.delete",
  "content.manage",
  "faq.manage",
  "faq.delete",
  "settings.manage",
  "features.manage",
  "users.view",
  "users.manage",
  "audit.view",
] as const;
export type AdminPermission = (typeof adminPermissions)[number];

export type AdminProfile = {
  id: string;
  user_id: string;
  display_name: string;
  role: AdminRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  last_login_at: string | null;
};

export type AdminSession = {
  userId: string;
  email: string;
  profile: AdminProfile;
};

export type ActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string[]>;
};

export type AppSettingValue = string | number | boolean | Record<string, unknown>;
export type AppSetting = {
  id: string;
  key: string;
  value: AppSettingValue;
  value_type: "string" | "number" | "boolean" | "json" | "url" | "email";
  category: string;
  label: string;
  description: string;
  is_public: boolean;
  is_editable: boolean;
  validation_schema: Record<string, unknown>;
};

export type FeatureFlag = {
  id: string;
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  scope: "public" | "admin" | "internal";
  configuration: Record<string, unknown>;
};
