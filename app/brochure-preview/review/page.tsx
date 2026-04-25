import Link from "next/link";

import styles from "@/app/review/page.module.css";
import { formatPrice } from "@/lib/menu/format";

export const metadata = {
  robots: {
    index: false,
    follow: false
  }
};

// Preview-only brochure route. Not part of the production app contract.
const previewItems = [
  {
    id: "dish-001",
    name: "Bruschetta Classica",
    description:
      "Charred sourdough, tomato concasse, basil oil, and shaved pecorino.",
    calories: 310,
    quantity: 2,
    total: 178
  },
  {
    id: "dish-003",
    name: "Grilled Salmon",
    description:
      "Atlantic salmon with browned butter potatoes, dill, and lemon beurre blanc.",
    calories: 540,
    quantity: 1,
    total: 245
  }
];

export default function BrochurePreviewReviewPage() {
  const totalItems = previewItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalCalories = previewItems.reduce(
    (sum, item) => sum + item.calories * item.quantity,
    0
  );
  const totalPrice = previewItems.reduce((sum, item) => sum + item.total, 0);

  return (
    <main className={styles.page}>
      <section className={styles.container}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Brochure Preview</p>
          <h1 className={styles.title}>Preview the browsing-only review layout</h1>
          <p className={styles.description}>
            This route previews a disabled ordering state for brochure/demo use.
            It is not part of the frozen production contract for Basilico
            customer routes.
          </p>
        </header>

        <section className={styles.layout}>
          <div className={styles.itemList}>
            {previewItems.map((item) => (
              <article key={item.id} className={styles.itemCard}>
                <div className={styles.itemHeader}>
                  <div>
                    <h2 className={styles.itemName}>{item.name}</h2>
                    <p className={styles.itemMeta}>
                      {item.quantity} {item.quantity === 1 ? "item" : "items"} ·{" "}
                      {item.calories * item.quantity} kcal
                    </p>
                  </div>

                  <strong className={styles.itemPrice}>
                    {formatPrice({ amount: item.total, currency: "SEK" })}
                  </strong>
                </div>

                <p className={styles.itemDescription}>{item.description}</p>

                <div className={styles.itemFooter}>
                  <div
                    className={styles.quantityControl}
                    aria-label={`Quantity controls for ${item.name}`}
                  >
                    <button
                      type="button"
                      className={styles.quantityButton}
                      aria-label={`Decrease quantity for ${item.name}`}
                    >
                      -
                    </button>
                    <span className={styles.quantityValue}>{item.quantity}</span>
                    <button
                      type="button"
                      className={styles.quantityButton}
                      aria-label={`Increase quantity for ${item.name}`}
                    >
                      +
                    </button>
                  </div>

                  <button type="button" className={styles.removeButton}>
                    Remove
                  </button>
                </div>
              </article>
            ))}
          </div>

          <aside className={styles.summaryCard}>
            <p className={styles.summaryEyebrow}>Summary</p>
            <div className={styles.summaryRow}>
              <span>Total items</span>
              <strong>{totalItems}</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Total calories</span>
              <strong>{totalCalories} kcal</strong>
            </div>
            <div className={styles.summaryRow}>
              <span>Total price</span>
              <strong>{formatPrice({ amount: totalPrice, currency: "SEK" })}</strong>
            </div>

            <div className={styles.fieldGroup}>
              <label className={styles.fieldLabel}>
                <span>Table reference</span>
                <input
                  value="Table 12"
                  readOnly
                  className={styles.textInput}
                  placeholder="Table 12"
                />
              </label>

              <label className={styles.fieldLabel}>
                <span>Guest count</span>
                <input
                  value="3"
                  readOnly
                  className={styles.textInput}
                  inputMode="numeric"
                  placeholder="Optional"
                />
              </label>

              <label className={styles.fieldLabel}>
                <span>Notes</span>
                <textarea
                  value="Birthday table. Serve mains after starters."
                  readOnly
                  className={styles.textArea}
                  placeholder="Optional note for the kitchen or service team"
                />
              </label>
            </div>

            <p className={styles.summaryNote}>
              This preview is browsing-only. It does not submit orders or
              represent a live kitchen handoff.
            </p>

            <button type="button" className={styles.confirmButton} disabled>
              Ordering disabled in preview
            </button>

            <Link href="/menu?table=12" className={styles.secondaryButton}>
              Back to Menu
            </Link>
          </aside>
        </section>
      </section>
    </main>
  );
}
