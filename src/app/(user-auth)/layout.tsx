import type { ReactNode } from "react";
import Link from "next/link";
import "./user-auth.css";
export default function UserAuthLayout({children}:{children:ReactNode}){return <div className="user-auth-page"><header className="auth-header"><Link href="/recursos/gerenciador-links-whatsapp" style={{marginLeft:"auto"}}>Conhecer a ferramenta</Link></header>{children}</div>}
