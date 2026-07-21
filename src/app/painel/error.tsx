"use client";
export default function PanelError({reset}:{reset:()=>void}){return <section className="panel-empty panel-card"><h2>Não foi possível carregar seus links.</h2><p>Tente novamente. Se o problema continuar, verifique a configuração do Supabase.</p><button className="panel-primary" onClick={reset}>Tentar novamente</button></section>}
