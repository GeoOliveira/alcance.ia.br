import "server-only";

type TurnstileResponse = { success?: boolean };

export async function verifyTurnstileToken(
  token: string | undefined,
  remoteIp?: string,
  fetcher: typeof fetch = fetch,
) {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return { ok: true as const, configured: false as const };
  if (!token) return { ok: false as const, configured: true as const };

  const body = new URLSearchParams({ secret, response: token });
  if (remoteIp && remoteIp !== "unknown") body.set("remoteip", remoteIp);

  try {
    const response = await fetcher("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body,
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return { ok: false as const, configured: true as const };
    const result = (await response.json()) as TurnstileResponse;
    return { ok: result.success === true, configured: true as const };
  } catch {
    return { ok: false as const, configured: true as const };
  }
}
