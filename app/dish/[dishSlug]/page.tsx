import Link from "next/link";
import { notFound } from "next/navigation";

import styles from "../../menu/[slug]/dish/[dishSlug]/page.module.css";
import { DishDetailOrderPanel } from "@/components/menu/dish-detail-order-panel";
import { PublicMenuUnavailable } from "@/components/menu/public-menu-unavailable";
import { formatDishNumber } from "@/lib/menu/assets";
import { formatDishPrice, formatPrice } from "@/lib/menu/format";
import { getCachedPublishedRestaurantOrNull } from "@/lib/menu/public-menu-cache";
import {
  getCategoryById,
  getDishBySlug
} from "@/lib/menu/restaurants";

type DishDetailsPageProps = {
  params: Promise<{
    dishSlug: string;
  }>;
  searchParams?: Promise<{
    table?: string;
  }>;
};

export default async function DishDetailsPage({
  params,
  searchParams
}: DishDetailsPageProps) {
  const { dishSlug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const restaurant = await getCachedPublishedRestaurantOrNull();

  if (!restaurant) {
    return (
      <PublicMenuUnavailable
        title="Menyn är inte publicerad"
        body="Restaurangen har ingen publicerad meny ännu."
      />
    );
  }

  const dish = getDishBySlug(restaurant, dishSlug);

  if (!dish) {
    notFound();
  }

  const category = getCategoryById(restaurant, dish.categoryId);
  const tableLabel = resolvedSearchParams?.table;
  const backHref = tableLabel
    ? `/?table=${encodeURIComponent(tableLabel)}`
    : "/";

  return (
    <main className={styles.page}>
      <section className={styles.container}>
        <Link href={backHref} className={styles.backLink}>
          Tillbaka till menyn
        </Link>

        <section className={styles.menuHero}>
          <div className={styles.menuHeroOrnament} aria-hidden="true">
            <span />
            <span />
          </div>

          <div className={styles.menuHeroTopline}>
            <span className={styles.numberBadge}>{formatDishNumber(dish.number)}</span>
            {category ? (
              <span className={styles.categoryBadge}>{category.label}</span>
            ) : null}
          </div>

          <div className={styles.menuHeroCopy}>
            <p className={styles.menuHeroKicker}>{restaurant.branding.name}</p>
            <h1 className={styles.menuHeroTitle}>{dish.name}</h1>
            <p className={styles.menuHeroDescription}>{dish.description}</p>
          </div>

          <div className={styles.menuHeroFooter}>
            <strong>{formatDishPrice(dish)}</strong>
            {dish.tags && dish.tags.length > 0 ? (
              <div className={styles.menuHeroTags} aria-label="Taggar">
                {dish.tags.slice(0, 3).map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section className={styles.primaryColumn}>
          <section className={styles.heroCopyCard}>
            <header className={styles.header}>
              <div>
                <p className={styles.kicker}>{restaurant.branding.name}</p>
                <h1 className={styles.title}>{dish.name}</h1>
              </div>
              <p className={styles.price}>{formatDishPrice(dish)}</p>
            </header>

            <p className={styles.description}>{dish.description}</p>

            {dish.variants && dish.variants.length > 0 ? (
              <div className={styles.variantGrid} aria-label="Varianter">
                {dish.variants.map((variant) => (
                  <div key={variant.id} className={styles.variantCard}>
                    <span>{variant.label}</span>
                    <strong>{formatPrice(variant.price)}</strong>
                  </div>
                ))}
              </div>
            ) : null}

            <div className={styles.topFacts}>
              <div className={styles.topFact}>
                <span className={styles.topFactLabel}>Kalorier</span>
                <strong>{dish.calories > 0 ? `${dish.calories} kcal` : "Ej angivet"}</strong>
              </div>
              <div className={styles.topFact}>
                <span className={styles.topFactLabel}>Kategori</span>
                <strong>{category?.label ?? "Meny"}</strong>
              </div>
              <div className={styles.topFact}>
                <span className={styles.topFactLabel}>Status</span>
                <strong className={styles.status}>
                  {dish.status === "available" ? "Tillgänglig" : "Ej tillgänglig"}
                </strong>
              </div>
            </div>
          </section>

          <section className={styles.lowerGrid}>
            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Innehåll</h2>
              <ul className={styles.list}>
                {dish.ingredients.map((ingredient) => (
                  <li key={ingredient}>{ingredient}</li>
                ))}
              </ul>
            </div>

            <div className={styles.panel}>
              <h2 className={styles.panelTitle}>Bra att veta</h2>
              <div className={styles.highlights}>
                <div className={styles.highlightItem}>
                  <span className={styles.highlightLabel}>Kategori</span>
                  <strong>{category?.label ?? "Meny"}</strong>
                </div>
                <div className={styles.highlightItem}>
                  <span className={styles.highlightLabel}>Menynummer</span>
                  <strong>{formatDishNumber(dish.number)}</strong>
                </div>
                <div className={styles.highlightItem}>
                  <span className={styles.highlightLabel}>Allergener</span>
                  <strong>
                    {dish.allergens.length > 0
                      ? dish.allergens.join(", ")
                      : "Inga allergener angivna"}
                  </strong>
                </div>
                <div className={styles.highlightItem}>
                  <span className={styles.highlightLabel}>Service</span>
                  <strong>Fråga personalen vid allergi eller specialkost.</strong>
                </div>
              </div>
            </div>
          </section>

          <DishDetailOrderPanel dish={dish} categoryLabel={category?.label} />
        </section>
      </section>
    </main>
  );
}
