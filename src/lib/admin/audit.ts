import "server-only";
import { createClient } from "@/lib/supabase/server";

type AuditEvent = {
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
  requestId?: string | null;
};

const forbiddenKeys = /password|token|secret|cookie|authorization|service.?role|message|email|name/i;

function sanitize(value: Record<string, unknown> | null | undefined) {
  if (!value) return null;
  return Object.fromEntries(Object.entries(value).filter(([key]) => !forbiddenKeys.test(key)).slice(0, 30));
}

export async function writeAudit(event: AuditEvent) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_write_audit", {
    p_action: event.action,
    p_entity_type: event.entityType,
    p_entity_id: event.entityId ?? null,
    p_before_data: sanitize(event.before),
    p_after_data: sanitize(event.after),
    p_metadata: sanitize(event.metadata) ?? {},
    p_request_id: event.requestId ?? null,
  });
  if (error) throw new Error("Não foi possível registrar a auditoria.");
}

export const auditSanitizerForTests = sanitize;
