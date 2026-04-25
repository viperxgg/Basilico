import { Suspense } from "react";
import Link from "next/link";

import { ReviewPageClient } from "@/app/review/review-page-client";
import styles from "./page.module.css";
import { siteConfig } from "@/lib/config/site";

export default function ReviewPage() {
  if (siteConfig.orderingMode === "browsing-only") {
    return (
      <main className={styles.page}>
        <section className={styles.container}>
          <section className={styles.emptyState}>
            <p className={styles.eyebrow}>Basilico</p>
            <h1 className={styles.emptyTitle}>
              Onlinebeställning kommer snart
            </h1>
            <p className={styles.emptyDescription}>
              Den digitala menyn är öppen för bläddring. Ring oss gärna om du
              vill beställa avhämtning eller har frågor om allergener.
            </p>
            <p className={styles.emptyDescription}>
              {siteConfig.orderMessages.orderingDisabled}
            </p>
            <Link href="/" className={styles.backButton}>
              Tillbaka till menyn
            </Link>
          </section>
        </section>
      </main>
    );
  }

  return (
    <Suspense fallback={null}>
      <ReviewPageClient />
    </Suspense>
  );
}
