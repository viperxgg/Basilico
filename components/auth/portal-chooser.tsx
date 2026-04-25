import Link from "next/link";

import { LogoutButton } from "@/components/auth/logout-button";
import styles from "@/components/auth/portal-chooser.module.css";
import type { AuthSession } from "@/lib/auth/types";

type PortalChooserProps = {
  session: AuthSession;
};

export function PortalChooser({ session }: PortalChooserProps) {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <p className={styles.eyebrow}>Nord Portal</p>
        <h1 className={styles.title}>Choose your workspace</h1>
        <p className={styles.subtitle}>
          Signed in as {session.user.displayName}. Select the internal surface you
          need for this shift.
        </p>

        <div className={styles.grid}>
          <Link className={styles.option} href="/admin">
            <span className={styles.role}>ADMIN</span>
            <h2 className={styles.optionTitle}>Operations dashboard</h2>
            <p className={styles.optionBody}>
              Manage incoming orders, assistance requests, queue cleanup, and
              service coordination.
            </p>
          </Link>

          <Link className={styles.option} href="/kitchen">
            <span className={styles.role}>KITCHEN</span>
            <h2 className={styles.optionTitle}>Kitchen board</h2>
            <p className={styles.optionBody}>
              Track active tickets, move order states forward, and keep pickup
              handoff clear.
            </p>
          </Link>
        </div>

        <div className={styles.actions}>
          <LogoutButton className={styles.signOutButton} />
        </div>
      </section>
    </main>
  );
}
