import type { PublicSettings } from "./definitions";

type PublicForm = "analysis" | "contact" | "signup";
type OperationalSettings = Pick<PublicSettings, "maintenanceEnabled" | "analysisEnabled" | "signupEnabled">;

export function isMaintenanceMode(settings: Pick<OperationalSettings, "maintenanceEnabled">, flags: Record<string, boolean>) {
  return settings.maintenanceEnabled || flags.maintenance_mode === true;
}

export function isPublicFormAvailable(form: PublicForm, settings: OperationalSettings, flags: Record<string, boolean>) {
  if (isMaintenanceMode(settings, flags)) return false;
  if (form === "analysis") return settings.analysisEnabled && flags.instagram_analysis !== false;
  if (form === "contact") return flags.contact_form !== false;
  return settings.signupEnabled && flags.user_signup !== false;
}
