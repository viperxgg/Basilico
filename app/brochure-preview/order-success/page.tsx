import Link from "next/link";

import styles from "@/app/review/page.module.css";

export const metadata = {
  robots: {
    index: false,
    follow: false
  }
};

// Preview-only brochure route. Not part of the production app contract.
export default function BrochurePreviewOrderSuccessPage() {
  return (
    <main className={styles.page}>
      <section className={styles.container}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Brochure Preview</p>
          <h1 className={styles.title}>Preview the disabled ordering state</h1>
          <p className={styles.description}>
            This route confirms that brochure/demo pages must not look like live
            ordering is active before Basilico signs off.
          </p>
        </header>

        <section className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>Online ordering is not active</h2>
          <p className={styles.emptyDescription}>
            This preview-only page does not submit orders or represent a live
            protected kitchen handoff.
          </p>
          <Link href="/menu?table=12" className={styles.backButton}>
            Return to Menu
          </Link>
        </section>
      </section>
    </main>
  );
}
