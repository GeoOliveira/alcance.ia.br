import { NextResponse } from "next/server";

export class SafeHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    public readonly publicMessage: string,
  ) {
    super(publicMessage);
    this.name = "SafeHttpError";
  }
}

export async function readJsonBody(request: Request, maxBytes: number): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type")?.toLowerCase() || "";
  if (!contentType.startsWith("application/json")) {
    throw new SafeHttpError(415, "unsupported_media_type", "Envie os dados no formato correto.");
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new SafeHttpError(413, "payload_too_large", "Os dados enviados excedem o tamanho permitido.");
  }

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > maxBytes) {
    throw new SafeHttpError(413, "payload_too_large", "Os dados enviados excedem o tamanho permitido.");
  }

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new SafeHttpError(400, "invalid_json", "Não foi possível interpretar os dados enviados.");
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new SafeHttpError(400, "invalid_body", "Revise os dados enviados.");
  }
  return value as Record<string, unknown>;
}

export function errorResponse(
  error: SafeHttpError,
  requestId: string,
  headers?: Record<string, string>,
) {
  return NextResponse.json(
    { error: error.publicMessage },
    {
      status: error.status,
      headers: {
        "Cache-Control": "no-store",
        "X-Request-Id": requestId,
        ...headers,
      },
    },
  );
}

export function successResponse(
  body: Record<string, unknown>,
  status: number,
  requestId: string,
) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", "X-Request-Id": requestId },
  });
}

export function logOperationFailure(
  operation: string,
  requestId: string,
  failureType: string,
  internalCode?: string,
) {
  console.error(
    JSON.stringify({
      level: "error",
      operation,
      requestId,
      failureType,
      ...(internalCode ? { internalCode } : {}),
      timestamp: new Date().toISOString(),
    }),
  );
}

export function integerFromEnv(name: string, fallback: number, minimum: number, maximum: number) {
  const parsed = Number.parseInt(process.env[name] || "", 10);
  return Number.isInteger(parsed) && parsed >= minimum && parsed <= maximum ? parsed : fallback;
}
