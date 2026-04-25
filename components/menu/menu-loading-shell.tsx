import styles from "./menu-loading-shell.module.css";

export function MenuLoadingShell() {
  return (
    <main className={styles.page} aria-busy="true" aria-live="polite">
      <section className={styles.hero}>
        <div className={styles.heroLineShort} />
        <div className={styles.heroLineLarge} />
        <div className={styles.heroLineMedium} />
      </section>

      <section className={styles.categories}>
        <span className={styles.pill} />
        <span className={styles.pill} />
        <span className={styles.pill} />
      </section>

      <section className={styles.list}>
        <article className={styles.card} />
        <article className={styles.card} />
        <article className={styles.card} />
      </section>
    </main>
  );
}
