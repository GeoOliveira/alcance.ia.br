"use client";

import { useActionState, useRef } from "react";
import type { ActionState } from "@/types/admin";

type ServerAction = (state: ActionState, formData: FormData) => Promise<ActionState>;
const initialState: ActionState = { ok: false, message: "" };

export function AdminConfirmDialog({
  action, id, operation, expected, title, description, buttonLabel, danger = true,
}: {
  action: ServerAction; id: string; operation: string; expected: string; title: string;
  description: string; buttonLabel: string; danger?: boolean;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [state, formAction, pending] = useActionState(action, initialState);
  return <><button type="button" className={danger ? "admin-danger-button" : "admin-secondary-button"} onClick={() => dialog.current?.showModal()}>{buttonLabel}</button>
    <dialog ref={dialog} className="admin-dialog" aria-labelledby={`dialog-${operation}-${id}`}>
      <form action={formAction} className="admin-form"><h2 id={`dialog-${operation}-${id}`}>{title}</h2><p>{description}</p>
        <input type="hidden" name="id" value={id} /><input type="hidden" name="operation" value={operation} /><input type="hidden" name="expected" value={expected} />
        <label>Motivo opcional<textarea name="reason" maxLength={500} /></label>
        <label>Digite <strong>{expected}</strong> para confirmar<input name="confirmation" required autoComplete="off" /></label>
        {state.message && <p className={state.ok ? "admin-success" : "admin-error"} role="status">{state.message}</p>}
        <div className="admin-form-actions"><button type="button" className="admin-secondary-button" onClick={() => dialog.current?.close()}>Cancelar</button><button className={danger ? "admin-danger-button" : "admin-primary-button"} disabled={pending}>{pending ? "Processando…" : buttonLabel}</button></div>
      </form>
    </dialog>
  </>;
}
