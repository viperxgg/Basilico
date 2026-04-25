"use client";

import styles from "@/app/validation/validation-page.module.css";

export function PrintReportButton() {
  return (
    <button
      type="button"
      className={styles.printButton}
      onClick={() => window.print()}
    >
      Print / Save as PDF
    </button>
  );
}
