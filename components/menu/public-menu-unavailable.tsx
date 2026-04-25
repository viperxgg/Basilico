import Link from "next/link";

import styles from "./public-menu-unavailable.module.css";

type PublicMenuUnavailableProps = {
  title?: string;
  body?: string;
};

export function PublicMenuUnavailable({
  title = "Menu unavailable",
  body = "A published menu is not available for this restaurant yet. Please check back shortly or ask staff for assistance."
}: PublicMenuUnavailableProps) {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>Published Menu</p>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.body}>{body}</p>
        <div className={styles.actions}>
          <Link href="/" className={styles.linkButton}>
            Return to home
          </Link>
        </div>
      </section>
    </main>
  );
}
