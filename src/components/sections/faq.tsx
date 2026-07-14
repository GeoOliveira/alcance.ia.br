"use client";
import { useState } from "react";
import { trackEvent } from "@/lib/analytics/track";

export function FAQAccordion({ items }: { items: readonly { question: string; answer: string }[] }) {
  const [open, setOpen] = useState(0);
  return <div className="faq-list">{items.map((item, index) => <div className="faq-item" key={item.question}><h3><button aria-expanded={open === index} onClick={() => { const willOpen = open !== index; setOpen(willOpen ? index : -1); if (willOpen) trackEvent("faq_opened", { cta_location: `faq_${index + 1}` }); }}>{item.question}<span>{open === index ? "−" : "+"}</span></button></h3>{open === index && <p>{item.answer}</p>}</div>)}</div>;
}
