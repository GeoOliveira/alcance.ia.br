"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type FormName = "analysis" | "contact" | "signup";

async function fetchFormToken(form: FormName) {
  const response = await fetch(`/api/form-token?form=${form}`, { cache: "no-store" });
  const body = (await response.json()) as { token?: string; error?: string };
  if (!response.ok || !body.token) throw new Error(body.error || "Atualize a página e tente novamente.");
  return body.token;
}

export function useFormProtection(form: FormName, enabled = true) {
  const [formToken, setFormToken] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [protectionError, setProtectionError] = useState("");
  const idempotencyKey = useRef(crypto.randomUUID());

  const refreshToken = useCallback(async () => {
    if (!enabled) return;
    setProtectionError("");
    try {
      setFormToken(await fetchFormToken(form));
    } catch (error) {
      setProtectionError(error instanceof Error ? error.message : "Atualize a página e tente novamente.");
    }
  }, [enabled, form]);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    fetchFormToken(form)
      .then((token) => {
        if (active) setFormToken(token);
      })
      .catch((error: unknown) => {
        if (active) setProtectionError(error instanceof Error ? error.message : "Atualize a página e tente novamente.");
      });
    return () => {
      active = false;
    };
  }, [enabled, form]);

  const rotateSubmission = useCallback(() => {
    idempotencyKey.current = crypto.randomUUID();
    setTurnstileToken("");
    void refreshToken();
  }, [refreshToken]);

  return {
    formToken,
    turnstileToken,
    setTurnstileToken,
    protectionError,
    ready: Boolean(formToken) && !protectionError,
    idempotencyKey,
    rotateSubmission,
  };
}
