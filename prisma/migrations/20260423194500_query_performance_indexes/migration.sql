-- Additional performance-focused indexes for the Phase 6 PostgreSQL foundation.
-- These target the expected published-menu, active-order, and active-assistance paths.

-- Menu release lookups
CREATE INDEX "menu_releases_restaurantId_status_publishedAt_idx"
ON "menu_releases"("restaurantId", "status", "publishedAt" DESC);

-- Enforce one published release per restaurant at the database level.
CREATE UNIQUE INDEX "menu_releases_one_published_per_restaurant_idx"
ON "menu_releases"("restaurantId")
WHERE "status" = 'PUBLISHED';

-- Menu read paths
CREATE INDEX "menu_categories_menuReleaseId_sortOrder_idx"
ON "menu_categories"("menuReleaseId", "sortOrder");

CREATE INDEX "menu_dishes_menuReleaseId_categoryId_status_sortOrder_idx"
ON "menu_dishes"("menuReleaseId", "categoryId", "status", "sortOrder");

CREATE INDEX "menu_dishes_menuReleaseId_status_menuNumber_idx"
ON "menu_dishes"("menuReleaseId", "status", "menuNumber");

CREATE INDEX "dish_ingredients_menuDishId_sortOrder_idx"
ON "dish_ingredients"("menuDishId", "sortOrder");

CREATE INDEX "dish_allergens_menuDishId_sortOrder_idx"
ON "dish_allergens"("menuDishId", "sortOrder");

-- Operational order reads
CREATE INDEX "orders_restaurantId_status_updatedAt_idx"
ON "orders"("restaurantId", "status", "updatedAt" DESC);

CREATE INDEX "orders_restaurantId_claimedByUserId_status_updatedAt_idx"
ON "orders"("restaurantId", "claimedByUserId", "status", "updatedAt" DESC);

CREATE INDEX "orders_restaurantId_active_queue_idx"
ON "orders"("restaurantId", "status", "createdAt" DESC)
WHERE "status" IN ('NEW', 'CLAIMED', 'IN_PROGRESS', 'READY');

-- Operational assistance reads
CREATE INDEX "assistance_requests_restaurantId_status_updatedAt_idx"
ON "assistance_requests"("restaurantId", "status", "updatedAt" DESC);

CREATE INDEX "assistance_requests_restaurantId_handledByUserId_status_updatedAt_idx"
ON "assistance_requests"("restaurantId", "handledByUserId", "status", "updatedAt" DESC);

CREATE INDEX "assistance_requests_restaurantId_active_waiter_idx"
ON "assistance_requests"("restaurantId", "tableRefNormalized", "createdAt" DESC)
WHERE "requestType" = 'CALL_WAITER'
  AND "status" IN ('NEW', 'CLAIMED', 'IN_PROGRESS');
