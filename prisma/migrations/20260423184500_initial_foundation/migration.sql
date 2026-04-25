-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRoleCode" AS ENUM ('ADMIN', 'KITCHEN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "MenuReleaseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MenuDishStatus" AS ENUM ('AVAILABLE', 'SOLD_OUT', 'HIDDEN');

-- CreateEnum
CREATE TYPE "RestaurantTableStatus" AS ENUM ('ACTIVE', 'DISABLED');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('NEW', 'CLAIMED', 'IN_PROGRESS', 'READY', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "OrderSource" AS ENUM ('CUSTOMER_MENU', 'ADMIN');

-- CreateEnum
CREATE TYPE "AssistanceRequestType" AS ENUM ('CALL_WAITER', 'ALLERGEN_HELP');

-- CreateEnum
CREATE TYPE "AssistanceRequestStatus" AS ENUM ('NEW', 'CLAIMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED');

-- CreateEnum
CREATE TYPE "AssistanceSource" AS ENUM ('CUSTOMER_MENU', 'ADMIN');

-- CreateEnum
CREATE TYPE "AuditLogActorType" AS ENUM ('USER', 'SYSTEM');

-- CreateEnum
CREATE TYPE "AuditLogTargetType" AS ENUM ('MENU_RELEASE', 'MENU_CATEGORY', 'MENU_DISH', 'RESTAURANT_TABLE', 'USER', 'ORDER', 'ASSISTANCE_REQUEST', 'SETTINGS');

-- CreateEnum
CREATE TYPE "LoginEventResult" AS ENUM ('SUCCESS', 'FAILURE', 'LOCKED');

-- CreateTable
CREATE TABLE "restaurants" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT,
    "domain" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'en-SE',
    "currencyCode" TEXT NOT NULL DEFAULT 'SEK',
    "timezone" TEXT NOT NULL DEFAULT 'Europe/Stockholm',
    "locationLabel" TEXT,
    "description" TEXT,
    "footerNote" TEXT,
    "primaryActionLabel" TEXT DEFAULT 'Call waiter',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roleCode" "UserRoleCode" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionTokenHash" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3),
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_releases" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" "MenuReleaseStatus" NOT NULL DEFAULT 'DRAFT',
    "title" TEXT,
    "notes" TEXT,
    "createdByUserId" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_releases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_categories" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "menuReleaseId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortLabel" TEXT,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "menu_dishes" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "menuReleaseId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "menuNumber" INTEGER,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priceMinor" INTEGER NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "calories" INTEGER,
    "imageUrl" TEXT,
    "imageAlt" TEXT,
    "status" "MenuDishStatus" NOT NULL DEFAULT 'AVAILABLE',
    "sortOrder" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "menu_dishes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dish_ingredients" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "menuDishId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dish_ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dish_allergens" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "menuDishId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dish_allergens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "restaurant_tables" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedCode" TEXT NOT NULL,
    "sortOrder" INTEGER,
    "seats" INTEGER,
    "status" "RestaurantTableStatus" NOT NULL DEFAULT 'ACTIVE',
    "qrToken" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "restaurant_tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "menuReleaseId" TEXT,
    "restaurantTableId" TEXT,
    "tableRefNormalized" TEXT NOT NULL,
    "tableLabelSnapshot" TEXT NOT NULL,
    "guestCount" INTEGER,
    "notes" TEXT,
    "subtotalMinor" INTEGER NOT NULL,
    "totalMinor" INTEGER NOT NULL,
    "currencyCode" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'NEW',
    "source" "OrderSource" NOT NULL DEFAULT 'CUSTOMER_MENU',
    "claimedByUserId" TEXT,
    "claimedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_items" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "menuDishId" TEXT,
    "lineNumber" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "dishNameSnapshot" TEXT NOT NULL,
    "dishSlugSnapshot" TEXT,
    "dishPriceSnapshotMinor" INTEGER NOT NULL,
    "currencyCodeSnapshot" TEXT NOT NULL,
    "categoryNameSnapshot" TEXT,
    "caloriesSnapshot" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_item_ingredient_snapshots" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "order_item_ingredient_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "order_item_allergen_snapshots" (
    "id" TEXT NOT NULL,
    "orderItemId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,

    CONSTRAINT "order_item_allergen_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assistance_requests" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "restaurantTableId" TEXT,
    "tableRefNormalized" TEXT NOT NULL,
    "tableLabelSnapshot" TEXT NOT NULL,
    "requestType" "AssistanceRequestType" NOT NULL,
    "message" TEXT NOT NULL,
    "status" "AssistanceRequestStatus" NOT NULL DEFAULT 'NEW',
    "source" "AssistanceSource" NOT NULL DEFAULT 'CUSTOMER_MENU',
    "handledByUserId" TEXT,
    "handledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assistance_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "actorUserId" TEXT,
    "actorType" "AuditLogActorType" NOT NULL,
    "actorLabel" TEXT,
    "targetType" "AuditLogTargetType" NOT NULL,
    "targetId" TEXT,
    "action" TEXT NOT NULL,
    "detailsJson" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "login_events" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "userId" TEXT,
    "usernameAttempted" TEXT NOT NULL,
    "result" "LoginEventResult" NOT NULL,
    "failureReason" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "login_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_slug_key" ON "restaurants"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "restaurants_domain_key" ON "restaurants"("domain");

-- CreateIndex
CREATE INDEX "users_restaurantId_status_idx" ON "users"("restaurantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "users_restaurantId_username_key" ON "users"("restaurantId", "username");

-- CreateIndex
CREATE UNIQUE INDEX "users_id_restaurantId_key" ON "users"("id", "restaurantId");

-- CreateIndex
CREATE INDEX "user_roles_restaurantId_roleCode_idx" ON "user_roles"("restaurantId", "roleCode");

-- CreateIndex
CREATE UNIQUE INDEX "user_roles_restaurantId_userId_roleCode_key" ON "user_roles"("restaurantId", "userId", "roleCode");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionTokenHash_key" ON "sessions"("sessionTokenHash");

-- CreateIndex
CREATE INDEX "sessions_restaurantId_userId_idx" ON "sessions"("restaurantId", "userId");

-- CreateIndex
CREATE INDEX "sessions_restaurantId_status_expiresAt_idx" ON "sessions"("restaurantId", "status", "expiresAt");

-- CreateIndex
CREATE INDEX "menu_releases_restaurantId_status_idx" ON "menu_releases"("restaurantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "menu_releases_restaurantId_version_key" ON "menu_releases"("restaurantId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "menu_releases_id_restaurantId_key" ON "menu_releases"("id", "restaurantId");

-- CreateIndex
CREATE INDEX "menu_categories_restaurantId_menuReleaseId_idx" ON "menu_categories"("restaurantId", "menuReleaseId");

-- CreateIndex
CREATE UNIQUE INDEX "menu_categories_menuReleaseId_slug_key" ON "menu_categories"("menuReleaseId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "menu_categories_menuReleaseId_sortOrder_key" ON "menu_categories"("menuReleaseId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "menu_categories_id_restaurantId_menuReleaseId_key" ON "menu_categories"("id", "restaurantId", "menuReleaseId");

-- CreateIndex
CREATE UNIQUE INDEX "menu_categories_id_restaurantId_key" ON "menu_categories"("id", "restaurantId");

-- CreateIndex
CREATE INDEX "menu_dishes_restaurantId_menuReleaseId_status_idx" ON "menu_dishes"("restaurantId", "menuReleaseId", "status");

-- CreateIndex
CREATE INDEX "menu_dishes_categoryId_status_idx" ON "menu_dishes"("categoryId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "menu_dishes_menuReleaseId_slug_key" ON "menu_dishes"("menuReleaseId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "menu_dishes_menuReleaseId_menuNumber_key" ON "menu_dishes"("menuReleaseId", "menuNumber");

-- CreateIndex
CREATE UNIQUE INDEX "menu_dishes_id_restaurantId_key" ON "menu_dishes"("id", "restaurantId");

-- CreateIndex
CREATE INDEX "dish_ingredients_restaurantId_menuDishId_idx" ON "dish_ingredients"("restaurantId", "menuDishId");

-- CreateIndex
CREATE UNIQUE INDEX "dish_ingredients_menuDishId_sortOrder_key" ON "dish_ingredients"("menuDishId", "sortOrder");

-- CreateIndex
CREATE INDEX "dish_allergens_restaurantId_menuDishId_idx" ON "dish_allergens"("restaurantId", "menuDishId");

-- CreateIndex
CREATE UNIQUE INDEX "dish_allergens_menuDishId_sortOrder_key" ON "dish_allergens"("menuDishId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_tables_qrToken_key" ON "restaurant_tables"("qrToken");

-- CreateIndex
CREATE INDEX "restaurant_tables_restaurantId_status_idx" ON "restaurant_tables"("restaurantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_tables_restaurantId_normalizedCode_key" ON "restaurant_tables"("restaurantId", "normalizedCode");

-- CreateIndex
CREATE UNIQUE INDEX "restaurant_tables_id_restaurantId_key" ON "restaurant_tables"("id", "restaurantId");

-- CreateIndex
CREATE INDEX "orders_restaurantId_status_createdAt_idx" ON "orders"("restaurantId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "orders_restaurantId_tableRefNormalized_status_idx" ON "orders"("restaurantId", "tableRefNormalized", "status");

-- CreateIndex
CREATE INDEX "orders_restaurantId_menuReleaseId_idx" ON "orders"("restaurantId", "menuReleaseId");

-- CreateIndex
CREATE INDEX "orders_restaurantId_restaurantTableId_idx" ON "orders"("restaurantId", "restaurantTableId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_id_restaurantId_key" ON "orders"("id", "restaurantId");

-- CreateIndex
CREATE INDEX "order_items_restaurantId_menuDishId_idx" ON "order_items"("restaurantId", "menuDishId");

-- CreateIndex
CREATE UNIQUE INDEX "order_items_orderId_lineNumber_key" ON "order_items"("orderId", "lineNumber");

-- CreateIndex
CREATE UNIQUE INDEX "order_item_ingredient_snapshots_orderItemId_sortOrder_key" ON "order_item_ingredient_snapshots"("orderItemId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "order_item_allergen_snapshots_orderItemId_sortOrder_key" ON "order_item_allergen_snapshots"("orderItemId", "sortOrder");

-- CreateIndex
CREATE INDEX "assistance_requests_restaurantId_requestType_status_created_idx" ON "assistance_requests"("restaurantId", "requestType", "status", "createdAt");

-- CreateIndex
CREATE INDEX "assistance_requests_restaurantId_tableRefNormalized_request_idx" ON "assistance_requests"("restaurantId", "tableRefNormalized", "requestType", "status");

-- CreateIndex
CREATE INDEX "assistance_requests_restaurantId_restaurantTableId_idx" ON "assistance_requests"("restaurantId", "restaurantTableId");

-- CreateIndex
CREATE UNIQUE INDEX "assistance_requests_id_restaurantId_key" ON "assistance_requests"("id", "restaurantId");

-- CreateIndex
CREATE INDEX "audit_logs_restaurantId_createdAt_idx" ON "audit_logs"("restaurantId", "createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_restaurantId_targetType_targetId_idx" ON "audit_logs"("restaurantId", "targetType", "targetId");

-- CreateIndex
CREATE INDEX "audit_logs_restaurantId_actorUserId_idx" ON "audit_logs"("restaurantId", "actorUserId");

-- CreateIndex
CREATE INDEX "login_events_restaurantId_createdAt_idx" ON "login_events"("restaurantId", "createdAt");

-- CreateIndex
CREATE INDEX "login_events_restaurantId_usernameAttempted_createdAt_idx" ON "login_events"("restaurantId", "usernameAttempted", "createdAt");

-- CreateIndex
CREATE INDEX "login_events_restaurantId_result_createdAt_idx" ON "login_events"("restaurantId", "result", "createdAt");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_userId_restaurantId_fkey" FOREIGN KEY ("userId", "restaurantId") REFERENCES "users"("id", "restaurantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_restaurantId_fkey" FOREIGN KEY ("userId", "restaurantId") REFERENCES "users"("id", "restaurantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_releases" ADD CONSTRAINT "menu_releases_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_releases" ADD CONSTRAINT "menu_releases_createdByUserId_restaurantId_fkey" FOREIGN KEY ("createdByUserId", "restaurantId") REFERENCES "users"("id", "restaurantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_categories" ADD CONSTRAINT "menu_categories_menuReleaseId_restaurantId_fkey" FOREIGN KEY ("menuReleaseId", "restaurantId") REFERENCES "menu_releases"("id", "restaurantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_dishes" ADD CONSTRAINT "menu_dishes_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_dishes" ADD CONSTRAINT "menu_dishes_menuReleaseId_restaurantId_fkey" FOREIGN KEY ("menuReleaseId", "restaurantId") REFERENCES "menu_releases"("id", "restaurantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "menu_dishes" ADD CONSTRAINT "menu_dishes_categoryId_restaurantId_menuReleaseId_fkey" FOREIGN KEY ("categoryId", "restaurantId", "menuReleaseId") REFERENCES "menu_categories"("id", "restaurantId", "menuReleaseId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dish_ingredients" ADD CONSTRAINT "dish_ingredients_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dish_ingredients" ADD CONSTRAINT "dish_ingredients_menuDishId_restaurantId_fkey" FOREIGN KEY ("menuDishId", "restaurantId") REFERENCES "menu_dishes"("id", "restaurantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dish_allergens" ADD CONSTRAINT "dish_allergens_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dish_allergens" ADD CONSTRAINT "dish_allergens_menuDishId_restaurantId_fkey" FOREIGN KEY ("menuDishId", "restaurantId") REFERENCES "menu_dishes"("id", "restaurantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "restaurant_tables" ADD CONSTRAINT "restaurant_tables_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_menuReleaseId_restaurantId_fkey" FOREIGN KEY ("menuReleaseId", "restaurantId") REFERENCES "menu_releases"("id", "restaurantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_restaurantTableId_restaurantId_fkey" FOREIGN KEY ("restaurantTableId", "restaurantId") REFERENCES "restaurant_tables"("id", "restaurantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_claimedByUserId_restaurantId_fkey" FOREIGN KEY ("claimedByUserId", "restaurantId") REFERENCES "users"("id", "restaurantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_orderId_restaurantId_fkey" FOREIGN KEY ("orderId", "restaurantId") REFERENCES "orders"("id", "restaurantId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_menuDishId_restaurantId_fkey" FOREIGN KEY ("menuDishId", "restaurantId") REFERENCES "menu_dishes"("id", "restaurantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_ingredient_snapshots" ADD CONSTRAINT "order_item_ingredient_snapshots_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_item_allergen_snapshots" ADD CONSTRAINT "order_item_allergen_snapshots_orderItemId_fkey" FOREIGN KEY ("orderItemId") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistance_requests" ADD CONSTRAINT "assistance_requests_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistance_requests" ADD CONSTRAINT "assistance_requests_restaurantTableId_restaurantId_fkey" FOREIGN KEY ("restaurantTableId", "restaurantId") REFERENCES "restaurant_tables"("id", "restaurantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assistance_requests" ADD CONSTRAINT "assistance_requests_handledByUserId_restaurantId_fkey" FOREIGN KEY ("handledByUserId", "restaurantId") REFERENCES "users"("id", "restaurantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actorUserId_restaurantId_fkey" FOREIGN KEY ("actorUserId", "restaurantId") REFERENCES "users"("id", "restaurantId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_events" ADD CONSTRAINT "login_events_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "login_events" ADD CONSTRAINT "login_events_userId_restaurantId_fkey" FOREIGN KEY ("userId", "restaurantId") REFERENCES "users"("id", "restaurantId") ON DELETE RESTRICT ON UPDATE CASCADE;

