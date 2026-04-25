import { revalidateTag, unstable_cache } from "next/cache";

import { menuReleaseStore } from "@/lib/menu/menu-release-store";
import { restaurant as staticRestaurant } from "@/data/restaurant";
import type { RestaurantTemplate } from "@/lib/types/restaurant";

const PUBLIC_MENU_TAG = "public-menu";
const PUBLIC_MENU_REVALIDATE_SECONDS = 300;

const getCachedPublishedRestaurant = unstable_cache(
  async (): Promise<RestaurantTemplate | null> => {
    try {
      return await menuReleaseStore.getPublishedRestaurantOrNull();
    } catch (error) {
      if (
        process.env.NODE_ENV === "development" &&
        error instanceof Error &&
        error.message.includes("Can't reach database server")
      ) {
        console.warn(
          "Using static Basilico menu fallback because PostgreSQL is unavailable in development."
        );
        return staticRestaurant;
      }

      throw error;
    }
  },
  ["public-menu:published-restaurant"],
  {
    tags: [PUBLIC_MENU_TAG],
    revalidate: PUBLIC_MENU_REVALIDATE_SECONDS
  }
);

export async function getCachedPublishedRestaurantOrNull() {
  return getCachedPublishedRestaurant();
}

export function invalidatePublicMenuCache() {
  revalidateTag(PUBLIC_MENU_TAG, "max");
}

export const publicMenuCacheConfig = {
  tag: PUBLIC_MENU_TAG,
  revalidateSeconds: PUBLIC_MENU_REVALIDATE_SECONDS
} as const;
