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

  const detailHref = tableLabel
    ? `/dish/${dish.slug}?table=${encodeURIComponent(tableLabel)}`
    : `/dish/${dish.slug}`;
  const detailAriaLabel = `Öppna detaljer för ${dish.name}`;
  const variantSummary = dish.variants
    ?.map((variant) => `${variant.label} ${formatPrice(variant.price)}`)
    .join(" · ");
  const isHighlighted = highlightedDishSlugs.has(dish.slug);
  const allergenLabel =
    dish.allergens.length > 0
      ? `Allergener: ${dish.allergens.join(", ")}`
      : "Allergener: fråga personalen vid osäkerhet";

  return (
    <article
      className={`${styles.menuCard} ${
        isHighlighted ? styles.menuCardHighlighted : ""
      }`}
    >
      <Link
        href={detailHref}
        className={styles.cardCoverLink}
        aria-label={detailAriaLabel}
      />

      <div className={styles.cardContent}>
        <span className={styles.dishNumberBadge}>
          {formatDishNumber(dish.number)}
        </span>
        {isHighlighted ? (
          <span className={styles.recommendedBadge}>Rekommenderas</span>
        ) : null}

        <div className={styles.headerRow}>
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

        <p className={styles.itemDescription}>{dish.description}</p>

        {variantSummary ? (
          <p className={styles.variantSummary}>{variantSummary}</p>
        ) : null}

        {dish.tags && dish.tags.length > 0 ? (
          <div className={styles.tagList} aria-label="Taggar">
            {dish.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        ) : null}

        <div className={styles.itemMeta} aria-label="Näring och innehåll">
          <span>{dish.calories > 0 ? `${dish.calories} kcal` : "Kcal ej angivet"}</span>
          <span aria-hidden="true">·</span>
          <span>{dish.ingredients.length} ingredienser</span>
        </div>

        <p className={styles.allergenLine}>{allergenLabel}</p>

        <div className={styles.cardActions}>
          <Link
            href={detailHref}
            className={styles.detailButton}
            aria-label={detailAriaLabel}
          >
            {detailLabel}
          </Link>

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
          ) : (
            <span className={styles.browseOnlyBadge}>Menyvisning</span>
          )}
        </div>
      </div>
    </article>
  );
}

export const DishCard = memo(DishCardComponent);
