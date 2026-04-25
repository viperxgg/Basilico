import type {
  DishRecord,
  MenuCategory,
  MenuCategoryId,
  RestaurantTemplate
} from "@/lib/types/restaurant";

export function getDishBySlug(
  restaurant: RestaurantTemplate,
  dishSlug: string
): DishRecord | undefined {
  return restaurant.dishes.find((dish) => dish.slug === dishSlug);
}

export function getDishById(
  restaurant: RestaurantTemplate,
  dishId: string
): DishRecord | undefined {
  return restaurant.dishes.find((dish) => dish.id === dishId);
}

export function getCategoryById(
  restaurant: RestaurantTemplate,
  categoryId: MenuCategoryId
): MenuCategory | undefined {
  return restaurant.categories.find((category) => category.id === categoryId);
}

export function getOrderedCategories(
  restaurant: RestaurantTemplate
): MenuCategory[] {
  return restaurant.categoryOrder
    .map((categoryId) =>
      restaurant.categories.find((category) => category.id === categoryId)
    )
    .filter((category): category is MenuCategory => Boolean(category));
}

export function getVisibleDishesByCategory(
  restaurant: RestaurantTemplate
): Array<{
  category: MenuCategory;
  dishes: DishRecord[];
}> {
  const dishesByCategory = new Map<MenuCategoryId, DishRecord[]>();
  const visibleCategories = getOrderedCategories(restaurant).filter(
    (category) => restaurant.settings?.showAlcohol !== false || !category.isAlcohol
  );
  const visibleCategoryIds = new Set(
    visibleCategories.map((category) => category.id)
  );

  for (const dish of restaurant.dishes) {
    if (dish.status === "hidden") {
      continue;
    }

    if (!visibleCategoryIds.has(dish.categoryId)) {
      continue;
    }

    const categoryDishes = dishesByCategory.get(dish.categoryId) ?? [];
    categoryDishes.push(dish);
    dishesByCategory.set(dish.categoryId, categoryDishes);
  }

  return visibleCategories.map((category) => ({
    category,
    dishes: (dishesByCategory.get(category.id) ?? []).sort(
      (left, right) => left.number - right.number
    )
  }));
}

export function getRestaurantSections(restaurant: RestaurantTemplate): Array<{
  category: MenuCategory;
  dishes: DishRecord[];
}> {
  return getVisibleDishesByCategory(restaurant);
}
