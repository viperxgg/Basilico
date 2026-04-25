export function formatDishNumber(number: number): string {
  return number.toString().padStart(3, "0");
}

export function buildDishAssetKey(number: number, slug: string): string {
  return `${formatDishNumber(number)}-${slug}`;
}

export function buildDishImagePath(
  restaurantSlug: string,
  number: number,
  slug: string,
  fileName = "hero.png"
): string {
  return `/restaurants/${restaurantSlug}/dishes/${buildDishAssetKey(
    number,
    slug
  )}/${fileName}`;
}

export function resolveDishImagePath(
  restaurantSlug: string,
  number: number,
  slug: string,
  imageRef?: string
) {
  if (restaurantSlug === "basilico") {
    return undefined;
  }

  const trimmedImageRef = imageRef?.trim();
  if (trimmedImageRef) {
    return trimmedImageRef;
  }

  return buildDishImagePath(restaurantSlug, number, slug);
}
