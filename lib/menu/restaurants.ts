import { menuReleaseStore } from "@/lib/menu/menu-release-store";
import { restaurant as staticRestaurant } from "@/data/restaurant";
import {
  getCategoryById,
  getDishById,
  getDishBySlug,
  getOrderedCategories,
  getRestaurantSections,
  getVisibleDishesByCategory
} from "@/lib/menu/restaurant-helpers";
import type { RestaurantTemplate } from "@/lib/types/restaurant";

export async function getRestaurants(): Promise<RestaurantTemplate[]> {
  const publishedRestaurant = await menuReleaseStore.getPublishedRestaurantOrNull();
  return publishedRestaurant ? [publishedRestaurant] : [];
}

export async function getRestaurantBySlug(
  slug: string
): Promise<RestaurantTemplate | undefined> {
  const publishedRestaurant = await menuReleaseStore.getPublishedRestaurantOrNull();
  if (!publishedRestaurant) {
    return undefined;
  }
  return publishedRestaurant.slug === slug ? publishedRestaurant : undefined;
}

export function getStaticRestaurant(): RestaurantTemplate {
  return staticRestaurant;
}

export function getDefaultRestaurant(): RestaurantTemplate {
  return staticRestaurant;
}

function canUseStaticMenuFallback(error: unknown) {
  return (
    process.env.NODE_ENV === "development" &&
    error instanceof Error &&
    error.message.includes("Can't reach database server")
  );
}

export async function getPublishedRestaurantOrNull(): Promise<RestaurantTemplate | null> {
  try {
    return await menuReleaseStore.getPublishedRestaurantOrNull();
  } catch (error) {
    if (canUseStaticMenuFallback(error)) {
      console.warn(
        "Using static Basilico menu fallback because PostgreSQL is unavailable in development."
      );
      return staticRestaurant;
    }

    throw error;
  }
}

export async function getPublishedRestaurant(): Promise<RestaurantTemplate> {
  const restaurant = await getPublishedRestaurantOrNull();

  if (!restaurant) {
    throw new Error("No published menu release is available.");
  }

  return restaurant;
}
export {
  getDishBySlug,
  getDishById,
  getCategoryById,
  getRestaurantSections,
  getOrderedCategories,
  getVisibleDishesByCategory
};
