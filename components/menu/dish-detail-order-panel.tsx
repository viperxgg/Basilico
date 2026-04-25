"use client";

import { useMemo, useState } from "react";

import { useCart } from "@/components/cart/cart-provider";
import styles from "./dish-detail-order-panel.module.css";
import { formatPrice } from "@/lib/menu/format";
import { siteConfig } from "@/lib/config/site";
import type { DishRecord } from "@/lib/types/restaurant";

type DishDetailOrderPanelProps = {
  dish: DishRecord;
  categoryLabel?: string;
};

export function DishDetailOrderPanel({
  dish,
  categoryLabel
}: DishDetailOrderPanelProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState(
    dish.variants?.[0]?.id ?? ""
  );
  const { addDish, getDishQuantity } = useCart();
  const orderingEnabled = siteConfig.orderingMode !== "browsing-only";
  const selectedVariant = dish.variants?.find(
    (variant) => variant.id === selectedVariantId
  );
  const selectedPrice = selectedVariant?.price ?? dish.price;

  const totalPrice = useMemo(
    () => selectedPrice.amount * quantity,
    [selectedPrice.amount, quantity]
  );
  const totalCalories = useMemo(
    () => dish.calories * quantity,
    [dish.calories, quantity]
  );
  const orderedQuantity = getDishQuantity(dish.id);
  const orderTotal = selectedPrice.amount * orderedQuantity;

  const canDecrease = quantity > 1;
  const canOrder = orderingEnabled && dish.status === "available";

  const handleOrder = () => {
    if (!canOrder) {
      return;
    }

    addDish(dish, quantity, selectedVariant);
  };

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerCopy}>
          <p className={styles.eyebrow}>Menyinformation</p>
          <h2 className={styles.title}>
            {orderingEnabled
              ? "Lägg rätten till bordets beställning"
              : "Beställning är inte aktiverad ännu"}
          </h2>
          <p className={styles.description}>
            {orderingEnabled
              ? "Justera antal, kontrollera totalsumman och skicka beställningen."
              : "Bläddra i menyn och be personalen om hjälp vid bordet när du vill beställa."}
          </p>
        </div>

        <div className={styles.supportingInfo}>
          <div className={styles.supportingItem}>
            <span className={styles.supportingLabel}>Kategori</span>
            <strong>{categoryLabel ?? "Meny"}</strong>
          </div>
          <div className={styles.supportingItem}>
            <span className={styles.supportingLabel}>Nummer</span>
            <strong>{dish.number}</strong>
          </div>
          <div className={styles.supportingItem}>
            <span className={styles.supportingLabel}>Status</span>
            <strong className={styles.statusText}>
              {dish.status === "available" ? "Tillgänglig" : "Ej tillgänglig"}
            </strong>
          </div>
        </div>
      </div>

      <div className={styles.body}>
        <section className={styles.orderSection}>
          <div className={styles.sectionHeading}>
            <span className={styles.sectionLabel}>Antal</span>
            <div className={styles.quantityControl} aria-label="Antalsväljare">
              <button
                type="button"
                className={styles.quantityButton}
                aria-label={`Minska antal för ${dish.name}`}
                disabled={!canDecrease || !orderingEnabled}
                onClick={() =>
                  setQuantity((current) => Math.max(1, current - 1))
                }
              >
                -
              </button>

              <span className={styles.quantityValue} aria-live="polite">
                {quantity}
              </span>

              <button
                type="button"
                className={styles.quantityButton}
                aria-label={`Öka antal för ${dish.name}`}
                disabled={!orderingEnabled}
                onClick={() => setQuantity((current) => current + 1)}
              >
                +
              </button>
            </div>
          </div>

          <div className={styles.summaryRow}>
            {dish.variants && dish.variants.length > 0 ? (
              <div className={styles.summaryItem}>
                <span className={styles.summaryLabel}>Variant</span>
                <div className={styles.quantityControl} aria-label="Variantväljare">
                  {dish.variants.map((variant) => (
                    <button
                      key={variant.id}
                      type="button"
                      className={styles.quantityButton}
                      aria-pressed={selectedVariantId === variant.id}
                      disabled={!orderingEnabled}
                      onClick={() => setSelectedVariantId(variant.id)}
                    >
                      {variant.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Val</span>
              <strong>
                {quantity} {quantity === 1 ? "portion" : "portioner"}
              </strong>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Totalpris</span>
              <strong>
                {formatPrice({
                  amount: totalPrice,
                  currency: dish.price.currency
                })}
              </strong>
            </div>
          </div>

          <button
            type="button"
            className={styles.primaryButton}
            disabled={!canOrder}
            onClick={handleOrder}
          >
            {orderingEnabled
              ? canOrder
                ? "Lägg till"
                : "Tillfälligt ej tillgänglig"
              : "Beställ vid bordet"}
          </button>

          <p className={styles.orderStatus} aria-live="polite">
            {orderedQuantity > 0
              ? `${orderedQuantity} valda · ${formatPrice({
                  amount: orderTotal,
                  currency: dish.price.currency
                })}`
              : orderingEnabled
                ? "Inget tillagt ännu"
                : "Digital beställning öppnas i nästa steg"}
          </p>
        </section>

        <section className={styles.nutritionSection}>
          <div className={styles.sectionHeadingCompact}>
            <span className={styles.sectionLabel}>Näring</span>
            <p className={styles.sectionCopy}>Ungefärliga värden</p>
          </div>

          <div className={styles.metricGrid}>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Kcal per portion</span>
              <strong className={styles.metricValue}>{dish.calories}</strong>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Antal</span>
              <strong className={styles.metricValue}>{quantity}</strong>
            </div>
            <div className={styles.metricCard}>
              <span className={styles.metricLabel}>Totalt kcal</span>
              <strong className={styles.metricValue}>{totalCalories}</strong>
            </div>
          </div>

          <p className={styles.note}>
            Näringsvärden är ungefärliga och kan variera beroende på tillagning
            och portionsstorlek.
          </p>
        </section>
      </div>
    </section>
  );
}
