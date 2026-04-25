import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import { categories } from "../data/categories.ts";
import { dishes } from "../data/dishes.ts";
import { basilicoBranding } from "../data/restaurants/basilico.ts";

const restaurantId = "basilico";
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl?.startsWith("postgresql://") && !databaseUrl?.startsWith("postgres://")) {
  console.error("DATABASE_URL must point to PostgreSQL.");
  process.exit(1);
}

const prisma = new PrismaClient({
  adapter: new PrismaPg(databaseUrl)
});

async function seed() {
  await prisma.restaurant.upsert({
    where: { id: restaurantId },
    update: {
      slug: restaurantId,
      name: basilicoBranding.name,
      shortName: basilicoBranding.shortName,
      locale: basilicoBranding.locale,
      currencyCode: basilicoBranding.currency,
      timezone: "Europe/Stockholm",
      addressLine: basilicoBranding.addressLine,
      phone: basilicoBranding.phone,
      concept: basilicoBranding.concept,
      openingHoursJson: basilicoBranding.openingHours ?? [],
      galleryImagesJson: basilicoBranding.galleryImages ?? [],
      orderingMode: basilicoBranding.orderingMode ?? "browsing-only",
      locationLabel: basilicoBranding.location,
      description: basilicoBranding.description,
      footerNote: basilicoBranding.footerNote,
      primaryActionLabel: basilicoBranding.primaryActionLabel,
      isActive: true
    },
    create: {
      id: restaurantId,
      slug: restaurantId,
      name: basilicoBranding.name,
      shortName: basilicoBranding.shortName,
      locale: basilicoBranding.locale,
      currencyCode: basilicoBranding.currency,
      timezone: "Europe/Stockholm",
      addressLine: basilicoBranding.addressLine,
      phone: basilicoBranding.phone,
      concept: basilicoBranding.concept,
      openingHoursJson: basilicoBranding.openingHours ?? [],
      galleryImagesJson: basilicoBranding.galleryImages ?? [],
      orderingMode: basilicoBranding.orderingMode ?? "browsing-only",
      locationLabel: basilicoBranding.location,
      description: basilicoBranding.description,
      footerNote: basilicoBranding.footerNote,
      primaryActionLabel: basilicoBranding.primaryActionLabel,
      isActive: true
    }
  });

  const existingRelease = await prisma.menuRelease.findFirst({
    where: { restaurantId },
    orderBy: { version: "desc" }
  });

  if (existingRelease) {
    console.log(`Basilico menu release already exists: v${existingRelease.version}`);
    return;
  }

  await prisma.$transaction(async (tx) => {
    const release = await tx.menuRelease.create({
      data: {
        id: crypto.randomUUID(),
        restaurantId,
        version: 1,
        status: "PUBLISHED",
        title: "Basilico published menu",
        notes: `Seeded from Basilico static menu data. items=${dishes.length}`,
        publishedAt: new Date()
      }
    });

    const categoryIdBySlug = new Map();

    for (const [index, category] of categories.entries()) {
      const row = await tx.menuCategory.create({
        data: {
          id: crypto.randomUUID(),
          restaurantId,
          menuReleaseId: release.id,
          slug: category.id,
          name: category.label,
          shortLabel: category.shortLabel,
          description: category.description ?? null,
          sortOrder: index + 1
        }
      });

      categoryIdBySlug.set(category.id, row.id);
    }

    for (const [index, menuDish] of dishes.entries()) {
      const categoryId = categoryIdBySlug.get(menuDish.categoryId);
      if (!categoryId) {
        throw new Error(`Missing category for dish ${menuDish.slug}`);
      }

      const row = await tx.menuDish.create({
        data: {
          id: crypto.randomUUID(),
          restaurantId,
          menuReleaseId: release.id,
          categoryId,
          slug: menuDish.slug,
          menuNumber: menuDish.number,
          name: menuDish.name,
          description: menuDish.description,
          priceMinor: menuDish.price.amount,
          currencyCode: menuDish.price.currency,
          calories: menuDish.calories,
          imageUrl: null,
          imageAlt: null,
          status:
            menuDish.status === "sold-out"
              ? "SOLD_OUT"
              : menuDish.status === "hidden"
                ? "HIDDEN"
                : "AVAILABLE",
          sortOrder: index + 1
        }
      });

      for (const [ingredientIndex, ingredient] of menuDish.ingredients.entries()) {
        await tx.dishIngredient.create({
          data: {
            id: crypto.randomUUID(),
            restaurantId,
            menuDishId: row.id,
            name: ingredient,
            sortOrder: ingredientIndex + 1
          }
        });
      }

      for (const [allergenIndex, allergen] of menuDish.allergens.entries()) {
        await tx.dishAllergen.create({
          data: {
            id: crypto.randomUUID(),
            restaurantId,
            menuDishId: row.id,
            name: allergen,
            sortOrder: allergenIndex + 1
          }
        });
      }
    }
  });

  console.log(`Seeded Basilico menu: ${categories.length} categories, ${dishes.length} items.`);
}

seed()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
