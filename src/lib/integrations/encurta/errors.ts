import type { EncurtaErrorCode } from "./types";

const publicMessages: Record<EncurtaErrorCode, string> = {
  integration_disabled: "O encurtamento está temporariamente indisponível.",
  not_configured: "O encurtamento está temporariamente indisponível.",
  rate_limited: "O limite de criação de links curtos foi atingido. Utilize o link oficial ou tente novamente mais tarde.",
  timeout: "A criação do link curto demorou mais que o esperado.",
  service_unavailable: "Não foi possível acessar o serviço de encurtamento.",
  invalid_response: "Não foi possível criar o link curto.",
  idempotency_conflict: "Não foi possível repetir esta solicitação com segurança.",
  request_failed: "Não foi possível criar o link curto.",
};

export class EncurtaError extends Error {
  constructor(public readonly code: EncurtaErrorCode, public readonly retryable = false, public readonly status?: number, public readonly retryCount = 0) {
    super(publicMessages[code]);
    this.name = "EncurtaError";
  }
}
