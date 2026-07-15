import type { BrandedContentPlatform } from "@/lib/meta/branded-content/types";
export function PlatformSelector({ value, onChange, disabled }: { value: BrandedContentPlatform; onChange: (value: BrandedContentPlatform) => void; disabled?: boolean }) {
  return <fieldset className="branded-platform"><legend>Plataforma</legend><div><button type="button" aria-pressed={value === "instagram"} onClick={() => onChange("instagram")} disabled={disabled}>Instagram</button><button type="button" aria-pressed={value === "facebook"} onClick={() => onChange("facebook")} disabled={disabled}>Facebook</button></div></fieldset>;
}
