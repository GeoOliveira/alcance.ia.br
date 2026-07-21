import { Fragment } from "react";
import { siteConfig } from "@/config/site";

function interpolate(value: string) {
  const replacements: Record<string, string> = {
    "{{contactEmail}}": siteConfig.contactEmail,
    "{{companyName}}": siteConfig.legal.companyName,
    "{{document}}": siteConfig.legal.document,
    "{{address}}": siteConfig.legal.address,
    "{{privacyOfficer}}": siteConfig.legal.privacyOfficer,
  };
  return Object.entries(replacements).reduce((text, [token, replacement]) => text.replaceAll(token, replacement), value);
}

export function EditableLegalContent({ value }: { value: string }) {
  const blocks = interpolate(value).split(/\n\s*\n/).map((item) => item.trim()).filter(Boolean);
  return <>{blocks.map((block, index) => {
    if (block.startsWith("### ")) return <h3 key={index}>{block.slice(4)}</h3>;
    if (block.startsWith("## ")) return <h2 id={block.toLowerCase().includes("contato") ? "contato-legal" : undefined} key={index}>{block.slice(3)}</h2>;
    if (block.split("\n").every((line) => line.startsWith("- "))) return <ul key={index}>{block.split("\n").map((line, itemIndex) => <li key={itemIndex}>{line.slice(2)}</li>)}</ul>;
    return <Fragment key={index}><p>{block.replaceAll("\n", " ")}</p></Fragment>;
  })}</>;
}
