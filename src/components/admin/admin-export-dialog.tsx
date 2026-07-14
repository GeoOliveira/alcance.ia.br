"use client";

import { useRef, useState } from "react";

export function AdminExportDialog({ href, label = "Exportar CSV" }: { href: string; label?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (confirmation !== "EXPORTAR") {
      setError("Digite EXPORTAR para confirmar.");
      return;
    }
    dialog.current?.close();
    window.location.assign(href);
  }

  return <>
    <button type="button" className="admin-secondary-button" onClick={() => dialog.current?.showModal()}>{label}</button>
    <dialog ref={dialog} className="admin-dialog" aria-labelledby="admin-export-title">
      <form className="admin-form" onSubmit={submit}>
        <h2 id="admin-export-title">Confirmar exportação</h2>
        <p>O arquivo será gerado no servidor, limitado e conterá somente os registros permitidos pelos filtros atuais.</p>
        <label>Digite <strong>EXPORTAR</strong> para confirmar
          <input value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" required />
        </label>
        {error && <p className="admin-error" role="alert">{error}</p>}
        <div className="admin-form-actions">
          <button type="button" className="admin-secondary-button" onClick={() => dialog.current?.close()}>Cancelar</button>
          <button className="admin-primary-button">Exportar CSV</button>
        </div>
      </form>
    </dialog>
  </>;
}
