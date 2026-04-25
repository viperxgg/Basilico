import type { DishRecord, Money } from "@/lib/types/restaurant";

export function formatPrice({ amount, currency }: Money): string {
  return `${amount} ${currency}`;
}

export function formatDishPrice(dish: DishRecord): string {
  if (dish.priceLabel) {
    return dish.priceLabel;
  }

  if (!dish.variants || dish.variants.length === 0) {
    return formatPrice(dish.price);
  }

  const prices = dish.variants.map((variant) => variant.price.amount);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  if (minPrice === maxPrice) {
    return formatPrice({ amount: minPrice, currency: dish.price.currency });
  }

  return `${minPrice}/${maxPrice} ${dish.price.currency}`;
}
