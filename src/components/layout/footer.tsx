"use client";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { Logo } from "@/components/ui/logo";

const columns = [
  { title: "Plataforma", links: [["Como funciona", "/como-funciona"], ["Recursos", "/recursos"], ["Analisar perfil", "/#analisar"]] },
  { title: "Institucional", links: [["Quem somos", "/quem-somos"], ["Contato", "/contato"], ["Exclusão de dados", "/exclusao-de-dados"]] },
  { title: "Legal", links: [["Privacidade", "/politica-de-privacidade"], ["Termos de uso", "/termos-de-uso"], ["Política de cookies", "/politica-de-cookies"]] },
];

export function Footer() {
  return <footer className="site-footer"><Container><div className="footer-grid"><div className="footer-brand"><Logo /><p>Tecnologia para transformar sinais digitais em decisões mais claras.</p><span className="made-in">◉ Projeto brasileiro em desenvolvimento</span></div>{columns.map((column) => <div key={column.title}><h2>{column.title}</h2>{column.links.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</div>)}</div>
    <div className="footer-bottom"><span>© {new Date().getFullYear()} Alcance IA</span><button className="link-button" onClick={() => window.dispatchEvent(new Event("alcance:open-cookies"))}>Preferências de cookies</button></div>
  </Container></footer>;
}
