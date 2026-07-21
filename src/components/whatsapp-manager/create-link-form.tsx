"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CreateLinkResponse = { data?: { id?: string }; error?: string };

export function CreateLinkForm() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    const form = new FormData(event.currentTarget);
    const labels = String(form.get("labels") || "").split(",").map((value) => value.trim()).filter(Boolean);
    try {
      const response = await fetch("/api/painel/links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: form.get("title"), phone: form.get("phone"), message: form.get("message"), labels, requestId: `manager_${crypto.randomUUID().replaceAll("-", "")}` }),
      });
      const payload = await response.json() as CreateLinkResponse;
      if (!response.ok) {
        setMessage(payload.error || "Não foi possível criar o link.");
        return;
      }
      const id = payload.data?.id;
      if (!id) {
        setMessage("O link foi criado, mas a resposta não pôde ser concluída.");
        return;
      }
      router.push(`/painel/links/${id}`);
      router.refresh();
    } catch {
      setMessage("Não foi possível criar o link. Verifique sua conexão.");
    } finally {
      setPending(false);
    }
  }

  return <form className="panel-card manager-form" onSubmit={submit}>
    <label>Título<input name="title" required maxLength={120} placeholder="Ex.: Atendimento comercial" /><small>Um nome interno para encontrar este link.</small></label>
    <fieldset><label>País<select name="country" defaultValue="55" disabled><option value="55">Brasil +55</option></select></label><label>WhatsApp<input name="phone" required inputMode="tel" autoComplete="tel" placeholder="(71) 99999-9999" /></label></fieldset>
    <label>Mensagem pré-preenchida<textarea name="message" maxLength={2000} placeholder="Olá! Gostaria de saber mais sobre…" /><small>A mensagem apenas abre preenchida no WhatsApp; nenhum envio é automático.</small></label>
    <label>Etiquetas<input name="labels" maxLength={300} placeholder="comercial, site, orçamento" /><small>Separe por vírgulas. Até 10 etiquetas.</small></label>
    <button className="panel-primary" disabled={pending}>{pending ? "Criando com Encurta.io…" : "Criar link curto"}</button>
    {message ? <p className="form-message" role="status">{message}</p> : null}
    <p className="auth-hint">Ao criar, a Alcance IA envia número e mensagem ao Encurta.io pelo servidor. Credenciais nunca são expostas ao navegador.</p>
  </form>;
}
