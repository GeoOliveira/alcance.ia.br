"use client";
import { useState } from "react";

export function FAQAccordion({ items }: { items: readonly { question: string; answer: string }[] }) {
  const [open, setOpen] = useState(0);
  return <div className="faq-list">{items.map((item, index) => <div className="faq-item" key={item.question}><h3><button aria-expanded={open === index} onClick={() => setOpen(open === index ? -1 : index)}>{item.question}<span>{open === index ? "−" : "+"}</span></button></h3>{open === index && <p>{item.answer}</p>}</div>)}</div>;
}
