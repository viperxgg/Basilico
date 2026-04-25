export type DishAvailabilityStatus = "available" | "sold-out" | "hidden";

export type DishBadge =
  | "signature"
  | "chef-pick"
  | "seasonal"
  | "popular"
  | "vegetarian";

export type MenuCategoryId = string;

export type MenuCategory = {
  id: MenuCategoryId;
  label: string;
  shortLabel: string;
  description?: string;
  isAlcohol?: boolean;
};

export type Money = {
  amount: number;
  currency: string;
};

export type DishRecord = {
  id: string;
  number: number;
  slug: string;
  name: string;
  categoryId: MenuCategoryId;
  description: string;
  ingredients: string[];
  price: Money;
  priceLabel?: string;
  calories: number;
  allergens: string[];
  badges?: DishBadge[];
  tags?: string[];
  variants?: Array<{
    id: string;
    label: string;
    price: Money;
    weight?: string;
  }>;
  status: DishAvailabilityStatus;
  imageRef?: string;
  imageAlt: string;
};

export type RestaurantBranding = {
  name: string;
  shortName: string;
  tagline?: string;
  location: string;
  addressLine?: string;
  phone?: string;
  phoneHref?: string;
  concept?: string;
  description: string;
  footerNote: string;
  locale: string;
  currency: string;
  cuisine?: string[];
  theme?: {
    primaryColor: string;
    accentColor: string;
  };
  primaryActionLabel: string;
  heroImageRef?: string;
  heroImageAlt?: string;
  entranceImageRef?: string;
  entranceImageAlt?: string;
  galleryImages?: Array<{
    src: string;
    alt: string;
    kind: "interior" | "entrance" | "food";
  }>;
  orderingMode?: "enabled" | "browsing-only";
  openingHours?: Array<{
    day: string;
    hours: string;
  }>;
  lastUpdatedLabel?: string;
};

export type RestaurantTemplate = {
  slug: string;
  branding: RestaurantBranding;
  settings?: {
    showAlcohol: boolean;
  };
  categoryOrder: MenuCategoryId[];
  categories: MenuCategory[];
  dishes: DishRecord[];
};
