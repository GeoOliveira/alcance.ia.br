"use client";

import { useState } from "react";

export function FaqFields({ question: initialQuestion = "", answer: initialAnswer = "", position, active = true }: { question?: string; answer?: string; position: number; active?: boolean }) {
  const [question, setQuestion] = useState(initialQuestion);
  const [answer, setAnswer] = useState(initialAnswer);
  return <><div className="admin-form-row"><label>Pergunta<input name="question" value={question} onChange={(event) => setQuestion(event.target.value)} required minLength={10} maxLength={240} /><small>{question.length}/240 caracteres</small></label><label>Posição<input name="position" type="number" defaultValue={position} min={0} max={10000} /></label></div><label>Resposta<textarea name="answer" value={answer} onChange={(event) => setAnswer(event.target.value)} required minLength={10} maxLength={2000} /><small>{answer.length}/2000 caracteres</small></label><label>Status<select name="isActive" defaultValue={String(active)}><option value="true">Ativa</option><option value="false">Inativa</option></select></label><details className="admin-faq-preview"><summary>Visualizar prévia pública</summary><div><strong>{question || "Sua pergunta aparecerá aqui"}</strong><p>{answer || "A resposta aparecerá aqui, sem interpretar HTML."}</p></div></details></>;
}
