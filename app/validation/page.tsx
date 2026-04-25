import type { Metadata } from "next";

import { PrintReportButton } from "@/components/validation/print-report-button";
import { validationReport } from "@/lib/config/validation-report";
import styles from "./validation-page.module.css";

export const metadata: Metadata = {
  title: "Operational Readiness Report",
  description:
    "Internal technical readiness report for Basilico."
};

const summaryRows = [
  { label: "Product", value: validationReport.summary.product },
  { label: "Client", value: validationReport.summary.client },
  { label: "Live URL", value: validationReport.summary.liveUrl, isLink: true },
  { label: "Deployment", value: validationReport.summary.deployment },
  { label: "Database", value: validationReport.summary.database },
  { label: "Ordering flow", value: validationReport.summary.orderingFlow },
  {
    label: "Admin/Kitchen access",
    value: validationReport.summary.adminKitchenAccess
  },
  { label: "Validation date", value: validationReport.validationDate }
] as const;

export default function ValidationPage() {
  return (
    <main className={styles.page}>
      <div className={styles.reportShell}>
        <div className={styles.screenActions}>
          <PrintReportButton />
        </div>

        <section className={styles.heroCard}>
          <div className={styles.heroGlow} aria-hidden="true" />
          <p className={styles.eyebrow}>Nord App by Smart Art AI</p>
          <h1 className={styles.title}>{validationReport.title}</h1>
          <p className={styles.subtitle}>{validationReport.subtitle}</p>
          <p className={styles.statement}>{validationReport.statement}</p>

          <div className={styles.banner}>
            Internal technical validation report. This page is not an official
            certification, regulator approval, or third-party compliance seal.
          </div>
        </section>

        <section className={styles.sectionCard}>
          <div className={styles.sectionHeading}>
            <p className={styles.sectionEyebrow}>01</p>
            <h2 className={styles.sectionTitle}>Validation Summary</h2>
          </div>

          <div className={styles.summaryGrid}>
            {summaryRows.map((row) => (
              <article key={row.label} className={styles.summaryItem}>
                <span className={styles.summaryLabel}>{row.label}</span>
                {"isLink" in row && row.isLink ? (
                  <a href={row.value} className={styles.summaryValueLink}>
                    {row.value}
                  </a>
                ) : (
                  <strong className={styles.summaryValue}>{row.value}</strong>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className={styles.sectionCard}>
          <div className={styles.sectionHeading}>
            <p className={styles.sectionEyebrow}>02</p>
            <h2 className={styles.sectionTitle}>Verified Capabilities</h2>
          </div>

          <div className={styles.capabilityGrid}>
            {validationReport.capabilities.map((item) => (
              <article key={item} className={styles.capabilityCard}>
                <span className={styles.checkMark} aria-hidden="true">
                  ✓
                </span>
                <span className={styles.capabilityText}>{item}</span>
              </article>
            ))}
          </div>
        </section>

        <section className={styles.splitSection}>
          <article className={styles.sectionCard}>
            <div className={styles.sectionHeading}>
              <p className={styles.sectionEyebrow}>03</p>
              <h2 className={styles.sectionTitle}>Security & Access Control</h2>
            </div>

            <div className={styles.bulletStack}>
              {validationReport.securityPoints.map((item) => (
                <div key={item} className={styles.bulletRow}>
                  <span className={styles.bulletDot} aria-hidden="true" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </article>

          <article className={`${styles.sectionCard} ${styles.scoreCard}`}>
            <div className={styles.sectionHeading}>
              <p className={styles.sectionEyebrow}>04</p>
              <h2 className={styles.sectionTitle}>Production Readiness Score</h2>
            </div>

            <div className={styles.scoreValue}>
              {validationReport.readinessScore.toFixed(1)}
              <span>/ 10</span>
            </div>
            <p className={styles.scoreLabel}>{validationReport.readinessLabel}</p>
            <p className={styles.scoreNote}>{validationReport.readinessNote}</p>
          </article>
        </section>

        <section className={styles.sectionCard}>
          <div className={styles.sectionHeading}>
            <p className={styles.sectionEyebrow}>05</p>
            <h2 className={styles.sectionTitle}>
              Remaining Operational Recommendations
            </h2>
          </div>

          <div className={styles.recommendationList}>
            {validationReport.recommendations.map((item) => (
              <div key={item} className={styles.recommendationRow}>
                <span className={styles.recommendationCheck} aria-hidden="true">
                  ✓
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <footer className={styles.footerCard}>
          <div>
            <p className={styles.footerBrand}>{validationReport.footer.line1}</p>
            <p className={styles.footerMeta}>{validationReport.footer.line2}</p>
          </div>

          <div className={styles.footerContact}>
            <span>{validationReport.footer.line3}</span>
            <a href={`mailto:${validationReport.footer.email}`}>
              {validationReport.footer.email}
            </a>
            <span>{validationReport.footer.copyright}</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
