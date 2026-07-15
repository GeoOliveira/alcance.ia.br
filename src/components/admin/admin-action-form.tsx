"use client";

import { useActionState } from "react";
import type { ActionState } from "@/types/admin";

type ServerAction = (state: ActionState, formData: FormData) => Promise<ActionState>;
const initialState: ActionState = { ok: false, message: "" };

export function AdminActionForm({ action, className = "admin-form", children, submitLabel = "Salvar", pendingLabel = "Salvando…" }: { action: ServerAction; className?: string; children: React.ReactNode; submitLabel?: string; pendingLabel?: string }) {
  const [state, formAction, pending] = useActionState(action, initialState);
  return <form action={formAction} className={className}>{children}
    {state.message && <p className={state.ok ? "admin-success" : "admin-error"} role="status">{state.message}</p>}
    <div className="admin-form-actions"><button className="admin-primary-button" disabled={pending}>{pending ? pendingLabel : submitLabel}</button></div>
  </form>;
}
