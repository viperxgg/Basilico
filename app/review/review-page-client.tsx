"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import styles from "./page.module.css";
import { ClientRequestError, requestJson } from "@/lib/client/request-json";
import { useCart } from "@/components/cart/cart-provider";
import { formatPrice } from "@/lib/menu/format";
import { siteConfig } from "@/lib/config/site";

function isValidTableLabel(value: string) {
  return /^[\p{L}\p{N}\s#\-]{1,24}$/u.test(value.trim());
}

export function ReviewPageClient() {
  const searchParams = useSearchParams();
  const routeTableLabel = searchParams.get("table")?.trim();
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCartUpdating, setIsCartUpdating] = useState(false);
  const [tableLabel, setTableLabel] = useState(routeTableLabel ?? "");
  const [guestCount, setGuestCount] = useState("");
  const [notes, setNotes] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [tableError, setTableError] = useState<string | null>(null);
  const requestIdRef = useRef<string>(crypto.randomUUID());
  const {
    items,
    totalItems,
    totalPrice,
    totalCalories,
    incrementDish,
    decrementDish,
    removeDish,
    clearCart
  } = useCart();
  const currency = items[0]?.dish.price.currency ?? "SEK";
  const menuHref = useMemo(
    () =>
      routeTableLabel
        ? `/menu?table=${encodeURIComponent(routeTableLabel)}`
        : "/menu",
    [routeTableLabel]
  );

  function withCartFeedback(action: () => void) {
    setIsCartUpdating(true);
    action();
    window.setTimeout(() => {
      setIsCartUpdating(false);
    }, 240);
  }

  async function handleConfirmOrder() {
    if (items.length === 0 || isSubmitting) {
      setSubmitError(siteConfig.orderMessages.emptyCart);
      return;
    }

    const normalizedTableLabel = tableLabel.trim();

    if (!normalizedTableLabel) {
      setTableError(siteConfig.orderMessages.tableRequired);
      setSubmitError(siteConfig.orderMessages.tableRequired);
      return;
    }

    if (!isValidTableLabel(normalizedTableLabel)) {
      setTableError(siteConfig.orderMessages.invalidTable);
      setSubmitError(siteConfig.orderMessages.invalidTable);
      return;
    }

    const normalizedGuestCount = guestCount.trim();
    const parsedGuestCount =
      normalizedGuestCount.length > 0
        ? Number.parseInt(normalizedGuestCount, 10)
        : undefined;

    if (
      normalizedGuestCount.length > 0 &&
      (!Number.isFinite(parsedGuestCount) || (parsedGuestCount ?? 0) < 1)
    ) {
      setSubmitError(siteConfig.orderMessages.invalidQuantity);
      return;
    }

    if (items.some((item) => !Number.isInteger(item.quantity) || item.quantity < 1)) {
      setSubmitError(siteConfig.orderMessages.invalidQuantity);
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setTableError(null);

    const requestBody = {
      clientRequestId: requestIdRef.current,
      tableLabel: normalizedTableLabel,
      guestCount: parsedGuestCount,
      notes,
      items: items.map((item) => ({
        dishId: item.dish.id,
        variantId: item.variant?.id,
        quantity: item.quantity
      }))
    };

    try {
      await requestJson("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody),
        timeoutMs: 15000,
        retryCount: 2,
        retryDelayMs: 1400,
        fallbackMessage: siteConfig.orderMessages.genericError
      });

      clearCart();
      setIsConfirmed(true);
      requestIdRef.current = crypto.randomUUID();
    } catch (error) {
      if (error instanceof ClientRequestError && error.status === null) {
        try {
          const response = await fetch("/api/orders", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(requestBody)
          });

          const payload = (await response.json().catch(() => null)) as
            | { error?: string }
            | null;

          if (!response.ok) {
            setSubmitError(
              payload?.error ?? siteConfig.orderMessages.genericError
            );
            return;
          }

          clearCart();
          setIsConfirmed(true);
          requestIdRef.current = crypto.randomUUID();
        } catch {
          setSubmitError(siteConfig.orderMessages.genericError);
          return;
        }
      } else {
        setSubmitError(
          error instanceof Error
            ? error.message
            : siteConfig.orderMessages.genericError
        );
        return;
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.container}>
        <header className={styles.header}>
          <p className={styles.eyebrow}>Bordsbeställning</p>
          <h1 className={styles.title}>Granska din beställning</h1>
          <p className={styles.description}>
            Kontrollera antal, ange bord och skicka beställningen när allt stämmer.
          </p>
        </header>

        {isConfirmed ? (
          <section className={styles.emptyState}>
            <div className={styles.successPulse} aria-hidden="true" />
            <h2 className={styles.emptyTitle}>{siteConfig.orderMessages.success}</h2>
            <p className={styles.emptyDescription}>
              {siteConfig.orderMessages.successDescription}
            </p>
            <Link href={menuHref} className={styles.backButton}>
              Tillbaka till menyn
            </Link>
          </section>
        ) : items.length === 0 ? (
          <section className={styles.emptyState}>
            <h2 className={styles.emptyTitle}>Inga rätter valda ännu</h2>
            <p className={styles.emptyDescription}>
              Gå tillbaka till menyn och välj rätter innan du fortsätter.
            </p>
            <Link href={menuHref} className={styles.backButton}>
              Tillbaka till menyn
            </Link>
          </section>
        ) : (
          <section
            className={styles.layout}
            aria-busy={isSubmitting || isCartUpdating}
          >
            <div className={styles.itemList}>
              {items.map((item) => (
                <article key={item.id} className={styles.itemCard}>
                  <div className={styles.itemHeader}>
                    <div>
                      <h2 className={styles.itemName}>
                        {item.dish.name}
                        {item.variant ? ` (${item.variant.label})` : ""}
                      </h2>
                      <p className={styles.itemMeta}>
                        {item.quantity} {item.quantity === 1 ? "rätt" : "rätter"} ·{" "}
                        {item.dish.calories * item.quantity} kcal
                      </p>
                    </div>

                    <strong className={styles.itemPrice}>
                      {formatPrice({
                        amount:
                          (item.variant?.price.amount ?? item.dish.price.amount) *
                          item.quantity,
                        currency: item.variant?.price.currency ?? item.dish.price.currency
                      })}
                    </strong>
                  </div>

                  <p className={styles.itemDescription}>{item.dish.description}</p>

                  <div className={styles.itemFooter}>
                    <div
                      className={styles.quantityControl}
                      aria-label={`Ändra antal för ${item.dish.name}`}
                    >
                      <button
                        type="button"
                        className={styles.quantityButton}
                        aria-label={`Minska antal för ${item.dish.name}`}
                        onClick={() =>
                          withCartFeedback(() => decrementDish(item.id))
                        }
                        disabled={isSubmitting}
                      >
                        -
                      </button>
                      <span className={styles.quantityValue}>{item.quantity}</span>
                      <button
                        type="button"
                        className={styles.quantityButton}
                        aria-label={`Öka antal för ${item.dish.name}`}
                        onClick={() =>
                          withCartFeedback(() => incrementDish(item.id))
                        }
                        disabled={isSubmitting}
                      >
                        +
                      </button>
                    </div>

                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={() =>
                        withCartFeedback(() => removeDish(item.id))
                      }
                      disabled={isSubmitting}
                    >
                      Ta bort
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <aside className={styles.summaryCard}>
              <p className={styles.summaryEyebrow}>Sammanfattning</p>
              <div className={styles.summaryRow}>
                <span>Antal</span>
                <strong>{totalItems}</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Kalorier</span>
                <strong>{totalCalories} kcal</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Totalt</span>
                <strong>{formatPrice({ amount: totalPrice, currency })}</strong>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>
                  <span>Bordsnummer</span>
                  <input
                    value={tableLabel}
                    onChange={(event) => {
                      setTableLabel(event.target.value);
                      setSubmitError(null);
                      setTableError(null);
                    }}
                    className={`${styles.textInput} ${
                      tableError ? styles.inputError : ""
                    }`}
                    placeholder="Bord 12"
                    disabled={isSubmitting}
                    aria-invalid={Boolean(tableError)}
                  />
                </label>

                {tableError ? (
                  <p className={styles.inlineError} role="alert">
                    {tableError}
                  </p>
                ) : null}

                <label className={styles.fieldLabel}>
                  <span>Antal gäster</span>
                  <input
                    value={guestCount}
                    onChange={(event) => {
                      setGuestCount(event.target.value);
                      setSubmitError(null);
                    }}
                    className={styles.textInput}
                    inputMode="numeric"
                    placeholder="Valfritt"
                    disabled={isSubmitting}
                  />
                </label>

                <label className={styles.fieldLabel}>
                  <span>Meddelande</span>
                  <textarea
                    value={notes}
                    onChange={(event) => {
                      setNotes(event.target.value);
                      setSubmitError(null);
                    }}
                    className={styles.textArea}
                    placeholder="Valfritt meddelande till köket eller personalen"
                    disabled={isSubmitting}
                  />
                </label>
              </div>

              {submitError ? (
                <div className={styles.errorStack} role="alert">
                  <p className={styles.errorMessage}>{submitError}</p>
                  <p className={styles.errorHint}>
                    {siteConfig.orderMessages.genericHelp}
                  </p>
                </div>
              ) : null}

              <p className={styles.summaryNote}>
                {isCartUpdating
                  ? siteConfig.orderMessages.addToCart
                  : "Kontrollera beställningen en gång till innan du skickar den."}
              </p>

              <button
                type="button"
                className={styles.confirmButton}
                disabled={items.length === 0 || isSubmitting}
                onClick={handleConfirmOrder}
              >
                {isSubmitting
                  ? siteConfig.orderMessages.submitting
                  : "Skicka beställning"}
              </button>

              <Link href={menuHref} className={styles.secondaryButton}>
                Lägg till fler rätter
              </Link>
            </aside>
          </section>
        )}
      </section>
    </main>
  );
}
