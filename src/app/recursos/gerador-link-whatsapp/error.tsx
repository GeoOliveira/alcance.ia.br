"use client";

import styles from "@/components/whatsapp-link-generator/whatsapp-generator.module.css";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className={`${styles.page} ${styles.unavailable}`}><div><span className={styles.eyebrow}>NÃO FOI POSSÍVEL CARREGAR</span><h1>Tente novamente em instantes</h1><p>Houve um problema temporário ao preparar a ferramenta.</p><button type="button" onClick={reset}>Tentar novamente</button></div></main>;
}
