import { NextRequest, NextResponse } from "next/server";

import {
  getCachedPublishedRestaurantOrNull,
  publicMenuCacheConfig
} from "@/lib/menu/public-menu-cache";
import {
  createErrorResponse,
  createRequestObservation
} from "@/lib/observability/runtime-observability";
import type { RestaurantTemplate } from "@/lib/types/restaurant";

export const runtime = "nodejs";

function toPublicRestaurantPayload(restaurant: RestaurantTemplate) {
  const publicRestaurant: Partial<RestaurantTemplate> = { ...restaurant };
  delete publicRestaurant.slug;
  return publicRestaurant;
}

export async function GET(request: NextRequest) {
  const observation = createRequestObservation(request, {
    category: "public-menu",
    action: "read"
  });

  try {
    const restaurant = await getCachedPublishedRestaurantOrNull();

    if (!restaurant) {
      return observation.finish(
        NextResponse.json(
          { error: "No published menu is available." },
          {
            status: 503,
            headers: {
              "Cache-Control": "private, no-store"
            }
          }
        ),
        { result: "unavailable" }
      );
    }

    return observation.finish(
      NextResponse.json(
        { restaurant: toPublicRestaurantPayload(restaurant) },
        {
          headers: {
            "Cache-Control": `public, s-maxage=${publicMenuCacheConfig.revalidateSeconds}, stale-while-revalidate=${publicMenuCacheConfig.revalidateSeconds}`
          }
        }
      ),
      { result: "success", categoryCount: restaurant.categories.length }
    );
  } catch (error) {
    observation.fail(error, { result: "exception" });
    return observation.finish(createErrorResponse("Unable to read published menu."), {
      result: "exception"
    });
  }
}
