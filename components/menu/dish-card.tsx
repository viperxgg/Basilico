"use client";

import { memo } from "react";
import Link from "next/link";

import styles from "./dish-card.module.css";
import { formatDishNumber } from "@/lib/menu/assets";
import { formatDishPrice, formatPrice } from "@/lib/menu/format";
import type { DishRecord } from "@/lib/types/restaurant";

type DishCardProps = {
  restaurantSlug: string;
  dish: DishRecord;
  tableLabel?: string;
  priority?: boolean;
  detailLabel?: string;
  isAdding?: boolean;
  onAdd?: (dish: DishRecord) => void;
};

const highlightedDishSlugs = new Set([
  "schnitzel-dorato",
  "black-and-white",
  "pappardelle-al-tartufo",
  "parma-ruccola"
]);

function DishCardComponent({
  restaurantSlug,
  dish,
  tableLabel,
  priority = false,
  detailLabel = "Detaljer",
  isAdding = false,
  onAdd
}: DishCardProps) {
  void restaurantSlug;
  void priority;
  void detailLabel;

  const detailHref = tableLabel
    ? `/dish/${dish.slug}?table=${encodeURIComponent(tableLabel)}`
    : `/dish/${dish.slug}`;
  const detailAriaLabel = `Öppna detaljer för ${dish.name}`;
  const variantSummary = dish.variants
    ?.map((variant) => `${variant.label} ${formatPrice(variant.price)}`)
    .join(" · ");
  const isHighlighted = highlightedDishSlugs.has(dish.slug);
  const ingredientSummary = dish.ingredients.slice(0, 5).join(", ");

  return (
    <article
      className={`${styles.menuItem} ${
        isHighlighted ? styles.menuItemHighlighted : ""
      }`}
    >
      <div className={styles.itemNumber} aria-hidden="true">
        <span>{formatDishNumber(dish.number)}</span>
      </div>

      <div className={styles.itemBody}>
        <div className={styles.itemHeader}>
          <h3 className={styles.itemName}>
            <Link
              href={detailHref}
              className={styles.titleLink}
              aria-label={detailAriaLabel}
            >
              {dish.name}
            </Link>
          </h3>
          <span className={styles.itemPrice}>{formatDishPrice(dish)}</span>
        </div>

        {isHighlighted ? (
          <p className={styles.recommendation}>Husets tips</p>
        ) : null}

        {dish.description ? (
          <p className={styles.itemDescription}>{dish.description}</p>
        ) : null}

        {variantSummary ? (
          <p className={styles.variantSummary}>{variantSummary}</p>
        ) : null}

        <div className={styles.itemMeta} aria-label="Näring och innehåll">
          {dish.calories > 0 ? <span>{dish.calories} kcal</span> : null}
          {ingredientSummary ? (
            <>
              {dish.calories > 0 ? <span aria-hidden="true">·</span> : null}
              <span>{ingredientSummary}</span>
            </>
          ) : null}
        </div>

        {dish.allergens.length > 0 ? (
          <div className={styles.allergenList} aria-label="Allergener">
            <span className={styles.allergenLabel}>Allergener</span>
            {dish.allergens.map((allergen) => (
              <span key={allergen} className={styles.allergenChip}>
                {allergen}
              </span>
            ))}
          </div>
        ) : (
          <p className={styles.allergenNote}>
            Fråga personalen vid allergi eller osäkerhet.
          </p>
        )}
      </div>

      {onAdd ? (
        <button
          type="button"
          className={styles.addButton}
          aria-label={`Lägg till ${dish.name}`}
          disabled={isAdding}
          onClick={() => onAdd(dish)}
        >
          {isAdding ? "..." : "+"}
        </button>
      ) : null}
    </article>
  );
}

export const DishCard = memo(DishCardComponent);
