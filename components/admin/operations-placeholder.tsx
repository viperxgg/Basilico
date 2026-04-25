import Link from "next/link";

import styles from "./operations-placeholder.module.css";

type OperationsPlaceholderProps = {
  title: string;
  description: string;
  status: string;
};

export function OperationsPlaceholder({
  title,
  description,
  status
}: OperationsPlaceholderProps) {
  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <p className={styles.eyebrow}>Basilico drift</p>
        <h1>{title}</h1>
        <p>{description}</p>
        <div className={styles.statusBox}>{status}</div>
        <nav className={styles.links} aria-label="Admin navigation">
          <Link href="/admin">Översikt</Link>
          <Link href="/admin/menu">Meny</Link>
          <Link href="/kitchen">Kök</Link>
        </nav>
      </section>
    </main>
  );
}
