import type { BrandedContentPlatform } from "@/lib/meta/branded-content/types";
export function AccountField({ platform, value, onChange, error, disabled }: { platform: BrandedContentPlatform; value: string; onChange: (value: string) => void; error?: string; disabled?: boolean }) {
  const instagram = platform === "instagram"; const id = instagram ? "branded-username" : "branded-page-url";
  return <label className="branded-field" htmlFor={id}>{instagram ? "Nome de usuário do Instagram" : "URL da Página do Facebook"}<input id={id} name={instagram ? "username" : "pageUrl"} value={value} onChange={(event) => onChange(event.target.value)} placeholder={instagram ? "Ex.: nike ou @nike" : "https://www.facebook.com/nomedapagina"} autoComplete="off" maxLength={instagram ? 31 : 500} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} disabled={disabled} />{error && <small id={`${id}-error`} role="alert">{error}</small>}</label>;
}
