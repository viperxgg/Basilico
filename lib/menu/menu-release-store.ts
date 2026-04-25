import { restaurant as staticRestaurant } from "@/data/restaurant";
import { prisma } from "@/lib/db";
import type {
  DishAvailabilityStatus,
  DishBadge,
  DishRecord,
  MenuCategory,
  RestaurantTemplate
} from "@/lib/types/restaurant";

type MenuReleaseSummary = {
  id: string;
  version: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  title: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type { MenuReleaseSummary };

export type DraftCategoryEditor = {
  id: string;
  label: string;
  shortLabel: string;
  description?: string;
  sortOrder: number;
};

export type DraftDishEditor = {
  id: string;
  categoryId: string;
  number: number;
  slug: string;
  name: string;
  description: string;
  priceMinor: number;
  currencyCode: string;
  calories?: number;
  status: DishAvailabilityStatus;
  imageRef?: string;
  imageAlt: string;
  ingredients: string[];
  allergens: string[];
};

export type MenuDraftEditor = {
  release: MenuReleaseSummary;
  categories: DraftCategoryEditor[];
  dishes: DraftDishEditor[];
};

type CategoryUpdateInput = {
  label?: string;
  shortLabel?: string;
  description?: string;
};

export type CreateCategoryInput = {
  label: string;
  shortLabel?: string;
  description?: string;
};

type DishUpdateInput = {
  categoryId?: string;
  name?: string;
  description?: string;
  priceMinor?: number;
  calories?: number | null;
  status?: DishAvailabilityStatus;
  imageRef?: string | null;
  imageAlt?: string;
  ingredients?: string[];
  allergens?: string[];
};

export type CreateDishInput = {
  categoryId: string;
  name: string;
  description: string;
  priceMinor: number;
  calories?: number | null;
  status: DishAvailabilityStatus;
  imageRef?: string;
  imageAlt: string;
  ingredients: string[];
  allergens: string[];
};

const STATIC_MENU_SEED_SIGNATURE = `${staticRestaurant.slug}:${staticRestaurant.dishes.length}:${staticRestaurant.dishes[0]?.slug ?? "empty"}`;
const staticCategoryById = new Map(
  staticRestaurant.categories.map((category) => [category.id, category])
);
const staticDishBySlug = new Map(
  staticRestaurant.dishes.map((dish) => [dish.slug, dish])
);

function getRestaurantId() {
  return staticRestaurant.slug;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function normalizeNameList(values: string[]) {
  return values
    .map((value) => value.trim())
    .filter((value, index, current) => value.length > 0 && current.indexOf(value) === index);
}

function dbStatus(status: DishAvailabilityStatus) {
  if (status === "sold-out") {
    return "SOLD_OUT" as const;
  }

  if (status === "hidden") {
    return "HIDDEN" as const;
  }

  return "AVAILABLE" as const;
}

function appStatus(status: "AVAILABLE" | "SOLD_OUT" | "HIDDEN"): DishAvailabilityStatus {
  if (status === "SOLD_OUT") {
    return "sold-out";
  }

  if (status === "HIDDEN") {
    return "hidden";
  }

  return "available";
}

function toReleaseSummary(release: {
  id: string;
  version: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  title: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): MenuReleaseSummary {
  return {
    id: release.id,
    version: release.version,
    status: release.status,
    title: release.title,
    publishedAt: release.publishedAt?.toISOString() ?? null,
    createdAt: release.createdAt.toISOString(),
    updatedAt: release.updatedAt.toISOString()
  };
}

function shouldSuppressDishImages() {
  return true;
}

async function ensureRestaurantRecord() {
  await prisma.restaurant.upsert({
    where: { id: staticRestaurant.slug },
    update: {
      slug: staticRestaurant.slug,
      name: staticRestaurant.branding.name,
      shortName: staticRestaurant.branding.shortName,
      locale: staticRestaurant.branding.locale,
      currencyCode: staticRestaurant.branding.currency,
      timezone: "Europe/Stockholm",
      addressLine: staticRestaurant.branding.addressLine,
      phone: staticRestaurant.branding.phone,
      concept: staticRestaurant.branding.concept,
      openingHoursJson: staticRestaurant.branding.openingHours ?? [],
      galleryImagesJson: staticRestaurant.branding.galleryImages ?? [],
      orderingMode: staticRestaurant.branding.orderingMode ?? "browsing-only",
      locationLabel: staticRestaurant.branding.location,
      description: staticRestaurant.branding.description,
      footerNote: staticRestaurant.branding.footerNote,
      primaryActionLabel: staticRestaurant.branding.primaryActionLabel,
      isActive: true
    },
    create: {
      id: staticRestaurant.slug,
      slug: staticRestaurant.slug,
      name: staticRestaurant.branding.name,
      shortName: staticRestaurant.branding.shortName,
      locale: staticRestaurant.branding.locale,
      currencyCode: staticRestaurant.branding.currency,
      timezone: "Europe/Stockholm",
      addressLine: staticRestaurant.branding.addressLine,
      phone: staticRestaurant.branding.phone,
      concept: staticRestaurant.branding.concept,
      openingHoursJson: staticRestaurant.branding.openingHours ?? [],
      galleryImagesJson: staticRestaurant.branding.galleryImages ?? [],
      orderingMode: staticRestaurant.branding.orderingMode ?? "browsing-only",
      locationLabel: staticRestaurant.branding.location,
      description: staticRestaurant.branding.description,
      footerNote: staticRestaurant.branding.footerNote,
      primaryActionLabel: staticRestaurant.branding.primaryActionLabel,
      isActive: true
    }
  });
}

async function createInitialPublishedRelease() {
  const restaurantId = getRestaurantId();
  const releaseId = crypto.randomUUID();

  await prisma.$transaction(async (tx) => {
    const release = await tx.menuRelease.create({
      data: {
        id: releaseId,
        restaurantId,
        version: 1,
        status: "PUBLISHED",
        title: "Initial published menu",
        notes: `Seeded from static menu files. ${STATIC_MENU_SEED_SIGNATURE}`,
        publishedAt: new Date()
      }
    });

    const categoryRecordByStaticId = new Map<string, string>();

    for (const [index, categoryId] of staticRestaurant.categoryOrder.entries()) {
      const category = staticCategoryById.get(categoryId);
      if (!category) {
        continue;
      }

      const record = await tx.menuCategory.create({
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

      categoryRecordByStaticId.set(category.id, record.id);
    }

    for (const [index, dish] of staticRestaurant.dishes.entries()) {
      const categoryRecordId = categoryRecordByStaticId.get(dish.categoryId);
      if (!categoryRecordId) {
        continue;
      }

      const record = await tx.menuDish.create({
        data: {
          id: crypto.randomUUID(),
          restaurantId,
          menuReleaseId: release.id,
          categoryId: categoryRecordId,
          slug: dish.slug,
          menuNumber: dish.number,
          name: dish.name,
          description: dish.description,
          priceMinor: dish.price.amount,
          currencyCode: dish.price.currency,
          calories: dish.calories,
          imageUrl: shouldSuppressDishImages() ? null : dish.imageRef ?? null,
          imageAlt: dish.imageAlt,
          status: dbStatus(dish.status),
          sortOrder: index + 1
        }
      });

      await tx.dishIngredient.createMany({
        data: dish.ingredients.map((ingredient, ingredientIndex) => ({
          id: crypto.randomUUID(),
          restaurantId,
          menuDishId: record.id,
          name: ingredient,
          sortOrder: ingredientIndex + 1
        }))
      });

      if (dish.allergens.length > 0) {
        await tx.dishAllergen.createMany({
          data: dish.allergens.map((allergen, allergenIndex) => ({
            id: crypto.randomUUID(),
            restaurantId,
            menuDishId: record.id,
            name: allergen,
            sortOrder: allergenIndex + 1
          }))
        });
      }
    }
  });
}

async function ensureMenuSeedData() {
  await ensureRestaurantRecord();

  const existingRelease = await prisma.menuRelease.findFirst({
    where: { restaurantId: getRestaurantId() },
    orderBy: { version: "desc" },
    select: { id: true }
  });

  if (!existingRelease) {
    await createInitialPublishedRelease();
  }
}

async function getPublishedRelease() {
  await ensureMenuSeedData();

  return prisma.menuRelease.findFirst({
    where: { restaurantId: getRestaurantId(), status: "PUBLISHED" },
    orderBy: [{ version: "desc" }],
    include: {
      categories: { orderBy: { sortOrder: "asc" } },
      dishes: {
        orderBy: [{ menuNumber: "asc" }, { sortOrder: "asc" }],
        include: {
          category: true,
          ingredients: { orderBy: { sortOrder: "asc" } },
          allergens: { orderBy: { sortOrder: "asc" } }
        }
      }
    }
  });
}

function buildRestaurantTemplate(release: Awaited<ReturnType<typeof getPublishedRelease>>): RestaurantTemplate {
  if (!release) {
    throw new Error("No published menu release is available.");
  }

  return {
    slug: staticRestaurant.slug,
    branding: staticRestaurant.branding,
    settings: staticRestaurant.settings,
    categoryOrder: release.categories.map((category) => category.slug),
    categories: release.categories.map(
      (category): MenuCategory => ({
        id: category.slug,
        label: category.name,
        shortLabel: category.shortLabel ?? category.name,
        description: category.description ?? undefined,
        isAlcohol: staticCategoryById.get(category.slug)?.isAlcohol
      })
    ),
    dishes: release.dishes.map((dish): DishRecord => {
      const staticDish = staticDishBySlug.get(dish.slug);

      return {
        id: dish.id,
        number: dish.menuNumber ?? 0,
        slug: dish.slug,
        name: dish.name,
        categoryId: dish.category.slug,
        description: dish.description,
        ingredients: dish.ingredients.map((ingredient) => ingredient.name),
        price: {
          amount: dish.priceMinor,
          currency: dish.currencyCode
        },
        calories: dish.calories ?? 0,
        allergens: dish.allergens.map((allergen) => allergen.name),
        badges: (staticDish?.badges ?? []) as DishBadge[],
        tags: staticDish?.tags,
        variants: staticDish?.variants,
        status: appStatus(dish.status),
        imageRef: shouldSuppressDishImages() ? undefined : dish.imageUrl ?? undefined,
        imageAlt: dish.imageAlt ?? dish.name
      };
    })
  };
}

async function getDraftRelease() {
  await ensureMenuSeedData();

  return prisma.menuRelease.findFirst({
    where: { restaurantId: getRestaurantId(), status: "DRAFT" },
    orderBy: [{ updatedAt: "desc" }, { version: "desc" }]
  });
}

async function getReleaseWithEditorData(releaseId: string) {
  return prisma.menuRelease.findFirst({
    where: { id: releaseId, restaurantId: getRestaurantId() },
    include: {
      categories: { orderBy: { sortOrder: "asc" } },
      dishes: {
        orderBy: [{ menuNumber: "asc" }, { sortOrder: "asc" }],
        include: {
          category: true,
          ingredients: { orderBy: { sortOrder: "asc" } },
          allergens: { orderBy: { sortOrder: "asc" } }
        }
      }
    }
  });
}

async function buildDraftEditor(releaseId: string): Promise<MenuDraftEditor> {
  const release = await getReleaseWithEditorData(releaseId);

  if (!release) {
    throw new Error("Menu release not found.");
  }

  return {
    release: toReleaseSummary(release),
    categories: release.categories.map((category) => ({
      id: category.slug,
      label: category.name,
      shortLabel: category.shortLabel ?? category.name,
      description: category.description ?? undefined,
      sortOrder: category.sortOrder
    })),
    dishes: release.dishes.map((dish) => ({
      id: dish.id,
      categoryId: dish.category.slug,
      number: dish.menuNumber ?? 0,
      slug: dish.slug,
      name: dish.name,
      description: dish.description,
      priceMinor: dish.priceMinor,
      currencyCode: dish.currencyCode,
      calories: dish.calories ?? undefined,
      status: appStatus(dish.status),
      imageRef: dish.imageUrl ?? undefined,
      imageAlt: dish.imageAlt ?? dish.name,
      ingredients: dish.ingredients.map((ingredient) => ingredient.name),
      allergens: dish.allergens.map((allergen) => allergen.name)
    }))
  };
}

class MenuReleaseStore {
  private publishedRestaurantCache:
    | {
        releaseId: string;
        restaurant: RestaurantTemplate;
      }
    | null = null;

  async getPublishedRestaurantOrNull() {
    const release = await getPublishedRelease();

    if (!release) {
      this.publishedRestaurantCache = null;
      return null;
    }

    if (this.publishedRestaurantCache?.releaseId === release.id) {
      return this.publishedRestaurantCache.restaurant;
    }

    const restaurant = buildRestaurantTemplate(release);
    this.publishedRestaurantCache = { releaseId: release.id, restaurant };
    return restaurant;
  }

  async getPublishedRestaurant() {
    const restaurant = await this.getPublishedRestaurantOrNull();

    if (!restaurant) {
      throw new Error("No published menu release is available.");
    }

    return restaurant;
  }

  async listReleases() {
    await ensureMenuSeedData();
    const rows = await prisma.menuRelease.findMany({
      where: { restaurantId: getRestaurantId() },
      orderBy: { version: "desc" }
    });

    return rows.map(toReleaseSummary);
  }

  async getCurrentDraftEditor() {
    const draft = await getDraftRelease();
    return draft ? buildDraftEditor(draft.id) : null;
  }

  async createDraftFromPublished(createdByUserId?: string) {
    await ensureMenuSeedData();

    return prisma.$transaction(async (tx) => {
      const existingDraft = await tx.menuRelease.findFirst({
        where: { restaurantId: getRestaurantId(), status: "DRAFT" }
      });

      if (existingDraft) {
        return {
          error: "A draft already exists. Edit or publish it before creating another."
        } as const;
      }

      const published = await tx.menuRelease.findFirst({
        where: { restaurantId: getRestaurantId(), status: "PUBLISHED" },
        orderBy: { version: "desc" },
        include: {
          categories: { orderBy: { sortOrder: "asc" } },
          dishes: {
            include: {
              ingredients: { orderBy: { sortOrder: "asc" } },
              allergens: { orderBy: { sortOrder: "asc" } }
            },
            orderBy: [{ menuNumber: "asc" }, { sortOrder: "asc" }]
          }
        }
      });

      if (!published) {
        return { error: "No published release is available to clone." } as const;
      }

      const latest = await tx.menuRelease.findFirst({
        where: { restaurantId: getRestaurantId() },
        orderBy: { version: "desc" }
      });
      const nextVersion = (latest?.version ?? 0) + 1;
      const release = await tx.menuRelease.create({
        data: {
          id: crypto.randomUUID(),
          restaurantId: getRestaurantId(),
          version: nextVersion,
          status: "DRAFT",
          title: `Draft v${nextVersion}`,
          notes: "Cloned from current published release.",
          createdByUserId: createdByUserId ?? null
        }
      });

      const categoryIdMap = new Map<string, string>();
      for (const category of published.categories) {
        const cloned = await tx.menuCategory.create({
          data: {
            id: crypto.randomUUID(),
            restaurantId: category.restaurantId,
            menuReleaseId: release.id,
            slug: category.slug,
            name: category.name,
            shortLabel: category.shortLabel,
            description: category.description,
            sortOrder: category.sortOrder
          }
        });
        categoryIdMap.set(category.id, cloned.id);
      }

      for (const dish of published.dishes) {
        const clonedDish = await tx.menuDish.create({
          data: {
            id: crypto.randomUUID(),
            restaurantId: dish.restaurantId,
            menuReleaseId: release.id,
            categoryId: categoryIdMap.get(dish.categoryId) ?? dish.categoryId,
            slug: dish.slug,
            menuNumber: dish.menuNumber,
            name: dish.name,
            description: dish.description,
            priceMinor: dish.priceMinor,
            currencyCode: dish.currencyCode,
            calories: dish.calories,
            imageUrl: dish.imageUrl,
            imageAlt: dish.imageAlt,
            status: dish.status,
            sortOrder: dish.sortOrder
          }
        });

        if (dish.ingredients.length > 0) {
          await tx.dishIngredient.createMany({
            data: dish.ingredients.map((ingredient) => ({
              id: crypto.randomUUID(),
              restaurantId: ingredient.restaurantId,
              menuDishId: clonedDish.id,
              name: ingredient.name,
              sortOrder: ingredient.sortOrder
            }))
          });
        }

        if (dish.allergens.length > 0) {
          await tx.dishAllergen.createMany({
            data: dish.allergens.map((allergen) => ({
              id: crypto.randomUUID(),
              restaurantId: allergen.restaurantId,
              menuDishId: clonedDish.id,
              name: allergen.name,
              sortOrder: allergen.sortOrder
            }))
          });
        }
      }

      return { release: toReleaseSummary(release) } as const;
    });
  }

  async updateDraftCategory(categoryId: string, input: CategoryUpdateInput) {
    const draft = await getDraftRelease();

    if (!draft) {
      return { error: "No active draft found." } as const;
    }

    const existing = await prisma.menuCategory.findFirst({
      where: { menuReleaseId: draft.id, slug: categoryId }
    });

    if (!existing) {
      return { error: "Draft category not found." } as const;
    }

    await prisma.menuCategory.update({
      where: { id: existing.id },
      data: {
        name: input.label?.trim() || existing.name,
        shortLabel: input.shortLabel?.trim() || existing.shortLabel,
        description:
          input.description !== undefined
            ? input.description.trim() || null
            : existing.description
      }
    });

    return { editor: await this.getCurrentDraftEditor() } as const;
  }

  async createDraftCategory(input: CreateCategoryInput) {
    const draft = await getDraftRelease();

    if (!draft) {
      return { error: "No active draft found." } as const;
    }

    const label = input.label.trim();
    const baseSlug = slugify(label);
    if (!label || !baseSlug) {
      return { error: "Category label is required." } as const;
    }

    const existingCategories = await prisma.menuCategory.findMany({
      where: { menuReleaseId: draft.id },
      orderBy: { sortOrder: "asc" }
    });
    let slug = baseSlug;
    let suffix = 2;

    while (existingCategories.some((category) => category.slug === slug)) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    await prisma.menuCategory.create({
      data: {
        id: crypto.randomUUID(),
        restaurantId: getRestaurantId(),
        menuReleaseId: draft.id,
        slug,
        name: label,
        shortLabel: input.shortLabel?.trim() || label,
        description: input.description?.trim() || null,
        sortOrder: existingCategories.length + 1
      }
    });

    return { editor: await this.getCurrentDraftEditor() } as const;
  }

  async deleteDraftCategory(categoryId: string) {
    const draft = await getDraftRelease();

    if (!draft) {
      return { error: "No active draft found." } as const;
    }

    const existing = await prisma.menuCategory.findFirst({
      where: { menuReleaseId: draft.id, slug: categoryId }
    });

    if (!existing) {
      return { error: "Draft category not found." } as const;
    }

    const linkedDish = await prisma.menuDish.findFirst({
      where: { menuReleaseId: draft.id, categoryId: existing.id },
      select: { id: true }
    });

    if (linkedDish) {
      return {
        error: "Delete or move dishes in this category before removing it."
      } as const;
    }

    await prisma.menuCategory.delete({ where: { id: existing.id } });
    const remaining = await prisma.menuCategory.findMany({
      where: { menuReleaseId: draft.id },
      orderBy: { sortOrder: "asc" }
    });

    for (const [index, category] of remaining.entries()) {
      await prisma.menuCategory.update({
        where: { id: category.id },
        data: { sortOrder: index + 1 }
      });
    }

    return { editor: await this.getCurrentDraftEditor() } as const;
  }

  async updateDraftDish(dishId: string, input: DishUpdateInput) {
    const draft = await getDraftRelease();

    if (!draft) {
      return { error: "No active draft found." } as const;
    }

    const existing = await prisma.menuDish.findFirst({
      where: { menuReleaseId: draft.id, id: dishId },
      include: { category: true }
    });

    if (!existing) {
      return { error: "Draft dish not found." } as const;
    }

    let targetCategoryRecordId = existing.categoryId;
    if (input.categoryId) {
      const targetCategory = await prisma.menuCategory.findFirst({
        where: { menuReleaseId: draft.id, slug: input.categoryId }
      });

      if (!targetCategory) {
        return { error: "Target category does not exist in the current draft." } as const;
      }

      targetCategoryRecordId = targetCategory.id;
    }

    await prisma.$transaction(async (tx) => {
      await tx.menuDish.update({
        where: { id: existing.id },
        data: {
          categoryId: targetCategoryRecordId,
          name: input.name?.trim() || existing.name,
          description: input.description?.trim() || existing.description,
          priceMinor: input.priceMinor ?? existing.priceMinor,
          calories: input.calories === undefined ? existing.calories : input.calories,
          status: input.status ? dbStatus(input.status) : existing.status,
          imageUrl:
            input.imageRef === undefined
              ? existing.imageUrl
              : input.imageRef?.trim() || null,
          imageAlt: input.imageAlt?.trim() || existing.imageAlt
        }
      });

      if (input.ingredients) {
        await tx.dishIngredient.deleteMany({ where: { menuDishId: existing.id } });
        await tx.dishIngredient.createMany({
          data: normalizeNameList(input.ingredients).map((ingredient, index) => ({
            id: crypto.randomUUID(),
            restaurantId: getRestaurantId(),
            menuDishId: existing.id,
            name: ingredient,
            sortOrder: index + 1
          }))
        });
      }

      if (input.allergens) {
        await tx.dishAllergen.deleteMany({ where: { menuDishId: existing.id } });
        await tx.dishAllergen.createMany({
          data: normalizeNameList(input.allergens).map((allergen, index) => ({
            id: crypto.randomUUID(),
            restaurantId: getRestaurantId(),
            menuDishId: existing.id,
            name: allergen,
            sortOrder: index + 1
          }))
        });
      }
    });

    return { editor: await this.getCurrentDraftEditor() } as const;
  }

  async createDraftDish(input: CreateDishInput) {
    const draft = await getDraftRelease();

    if (!draft) {
      return { error: "No active draft found." } as const;
    }

    const name = input.name.trim();
    const description = input.description.trim();
    const imageAlt = input.imageAlt.trim();
    const slugBase = slugify(name);

    if (!name || !description || !imageAlt || !slugBase) {
      return {
        error: "Name, description, and image reference details are required."
      } as const;
    }

    if (!Number.isInteger(input.priceMinor) || input.priceMinor < 0) {
      return { error: "Price must be a valid integer minor amount." } as const;
    }

    const targetCategory = await prisma.menuCategory.findFirst({
      where: { menuReleaseId: draft.id, slug: input.categoryId }
    });

    if (!targetCategory) {
      return { error: "Target category does not exist in the current draft." } as const;
    }

    const existingDishes = await prisma.menuDish.findMany({
      where: { menuReleaseId: draft.id },
      orderBy: [{ menuNumber: "asc" }, { sortOrder: "asc" }]
    });
    let slug = slugBase;
    let suffix = 2;

    while (existingDishes.some((dish) => dish.slug === slug)) {
      slug = `${slugBase}-${suffix}`;
      suffix += 1;
    }

    const nextNumber =
      existingDishes.reduce((max, dish) => Math.max(max, dish.menuNumber ?? 0), 0) + 1;

    await prisma.$transaction(async (tx) => {
      const dish = await tx.menuDish.create({
        data: {
          id: crypto.randomUUID(),
          restaurantId: getRestaurantId(),
          menuReleaseId: draft.id,
          categoryId: targetCategory.id,
          slug,
          menuNumber: nextNumber,
          name,
          description,
          priceMinor: input.priceMinor,
          currencyCode: staticRestaurant.branding.currency,
          calories: input.calories ?? null,
          imageUrl: input.imageRef?.trim() || null,
          imageAlt,
          status: dbStatus(input.status),
          sortOrder: existingDishes.length + 1
        }
      });

      await tx.dishIngredient.createMany({
        data: normalizeNameList(input.ingredients).map((ingredient, index) => ({
          id: crypto.randomUUID(),
          restaurantId: getRestaurantId(),
          menuDishId: dish.id,
          name: ingredient,
          sortOrder: index + 1
        }))
      });

      await tx.dishAllergen.createMany({
        data: normalizeNameList(input.allergens).map((allergen, index) => ({
          id: crypto.randomUUID(),
          restaurantId: getRestaurantId(),
          menuDishId: dish.id,
          name: allergen,
          sortOrder: index + 1
        }))
      });
    });

    return { editor: await this.getCurrentDraftEditor() } as const;
  }

  async deleteDraftDish(dishId: string) {
    const draft = await getDraftRelease();

    if (!draft) {
      return { error: "No active draft found." } as const;
    }

    const existing = await prisma.menuDish.findFirst({
      where: { menuReleaseId: draft.id, id: dishId }
    });

    if (!existing) {
      return { error: "Draft dish not found." } as const;
    }

    await prisma.$transaction(async (tx) => {
      await tx.dishAllergen.deleteMany({ where: { menuDishId: existing.id } });
      await tx.dishIngredient.deleteMany({ where: { menuDishId: existing.id } });
      await tx.menuDish.delete({ where: { id: existing.id } });
    });

    return { editor: await this.getCurrentDraftEditor() } as const;
  }

  async publishDraftRelease(releaseId: string) {
    await ensureMenuSeedData();

    return prisma.$transaction(async (tx) => {
      const release = await tx.menuRelease.findFirst({
        where: { id: releaseId, restaurantId: getRestaurantId(), status: "DRAFT" },
        include: { categories: true, dishes: true }
      });

      if (!release) {
        return { error: "Draft release not found." } as const;
      }

      if (release.categories.length === 0 || release.dishes.length === 0) {
        return {
          error: "A draft must contain at least one category and one dish before publishing."
        } as const;
      }

      await tx.menuRelease.updateMany({
        where: { restaurantId: getRestaurantId(), status: "PUBLISHED" },
        data: { status: "ARCHIVED" }
      });

      const published = await tx.menuRelease.update({
        where: { id: releaseId },
        data: { status: "PUBLISHED", publishedAt: new Date() }
      });

      this.publishedRestaurantCache = null;

      return { release: toReleaseSummary(published) } as const;
    });
  }
}

declare global {
  var __nordMenuReleaseStore__: MenuReleaseStore | undefined;
}

const existingStore = globalThis.__nordMenuReleaseStore__;

export const menuReleaseStore =
  existingStore instanceof MenuReleaseStore
    ? existingStore
    : (globalThis.__nordMenuReleaseStore__ = new MenuReleaseStore());
